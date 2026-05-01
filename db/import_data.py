#!/usr/bin/env python3
"""Import vocabulary and episode data into MySQL."""
import json
import os
import re
import mysql.connector
from mysql.connector import Error

# Load vocabulary data
VOCAB_PATH = os.path.expanduser("~/Library/Mobile Documents/iCloud~md~obsidian/Documents/russian/vocab/rrs-vocabulary.json")
MAT_DIR = os.path.expanduser("~/Library/Mobile Documents/iCloud~md~obsidian/Documents/russian/materials/rrs")

# MySQL connection config
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'database': 'russian_learning',
    'user': 'russian',
    'password': 'russian123',
    'charset': 'utf8mb4'
}

def load_vocab_data():
    with open(VOCAB_PATH, encoding='utf-8') as f:
        data = json.load(f)
    return data['vocabulary']

def parse_material_page(filepath):
    """Parse a material page to extract metadata and vocabulary."""
    with open(filepath, encoding='utf-8') as f:
        content = f.read()
    
    info = {}
    
    # Parse YAML frontmatter
    fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if fm_match:
        fm = fm_match.group(1)
        for line in fm.split('\n'):
            if ':' in line:
                key, val = line.split(':', 1)
                key = key.strip()
                val = val.strip().strip('"')
                if key == 'episode':
                    info['episode'] = int(val)
                elif key == 'level':
                    info['level'] = val
                elif key == 'title':
                    info['title'] = val
    
    # Extract Chinese summary
    summary_match = re.search(r'## 摘要\n\n(.*?)(?=\n## )', content, re.DOTALL)
    if summary_match:
        info['summary'] = summary_match.group(1).strip()
    
    # Extract good sentences
    sentences = []
    in_sentences = False
    for line in content.split('\n'):
        if '## 好句子' in line:
            in_sentences = True
            continue
        if in_sentences and line.startswith('## '):
            break
        if in_sentences and line.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.')):
            # Parse: **Russian sentence.** — Chinese translation。（note）
            m = re.match(r'\d+\.\s+\*\*(.*?)\*\*\s+—\s+(.*?)（(.*?)）', line)
            if m:
                sentences.append({
                    'ru': m.group(1),
                    'cn': m.group(2),
                    'note': m.group(3)
                })
    info['sentences'] = sentences
    
    # Extract notes
    notes_match = re.search(r'## 笔记\n\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
    if notes_match:
        info['notes'] = notes_match.group(1).strip()
    
    return info

def import_episodes(cursor):
    """Import episode data from material pages."""
    print("Importing episodes...")
    
    episodes = []
    for f in sorted(os.listdir(MAT_DIR)):
        if not f.endswith('.md'):
            continue
        filepath = os.path.join(MAT_DIR, f)
        info = parse_material_page(filepath)
        
        if 'episode' not in info:
            # Try to extract from filename
            m = re.search(r'rrs(\d+)', f)
            if m:
                info['episode'] = int(m.group(1))
        
        if 'episode' in info:
            episodes.append(info)
    
    # Insert episodes
    sql = """
    INSERT INTO episodes (episode_number, title, title_cn, level, summary, word_count)
    VALUES (%s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE title=VALUES(title), level=VALUES(level), summary=VALUES(summary)
    """
    
    for ep in episodes:
        title = ep.get('title', f"RRS #{ep['episode']}")
        # Extract Russian title (after "—")
        title_parts = title.split('—', 1)
        title_ru = title_parts[0].strip() if len(title_parts) > 1 else title
        title_cn = title_parts[1].strip() if len(title_parts) > 1 else ''
        
        cursor.execute(sql, (
            ep['episode'],
            title_ru,
            title_cn,
            ep.get('level', 'B1-B2'),
            ep.get('summary', ''),
            0  # word_count will be updated later
        ))
    
    print(f"  Imported {len(episodes)} episodes")
    return len(episodes)

def import_vocab(cursor, vocab_data):
    """Import vocabulary data."""
    print("Importing vocabulary...")
    
    sql = """
    INSERT INTO vocab (word, stress, chinese, pos, level, frequency, episode_count)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE frequency=VALUES(frequency), episode_count=VALUES(episode_count)
    """
    
    batch = []
    for item in vocab_data:
        batch.append((
            item['word'],
            item['word'],  # stress = word (we don't have stress marks in the extracted data)
            '',  # chinese will be added later
            '',  # pos will be added later
            item['level'],
            item['frequency'],
            item['episode_count']
        ))
        
        if len(batch) >= 100:
            cursor.executemany(sql, batch)
            batch = []
    
    if batch:
        cursor.executemany(sql, batch)
    
    print(f"  Imported {len(vocab_data)} vocabulary items")

def import_vocab_episodes(cursor, vocab_data):
    """Import vocab-episode associations."""
    print("Importing vocab-episode associations...")
    
    # Get vocab id mapping
    cursor.execute("SELECT id, word FROM vocab")
    word_to_id = {row[1]: row[0] for row in cursor.fetchall()}
    
    # Get episode id mapping
    cursor.execute("SELECT id, episode_number FROM episodes")
    ep_to_id = {row[1]: row[0] for row in cursor.fetchall()}
    
    sql = """
    INSERT IGNORE INTO vocab_episodes (vocab_id, episode_id)
    VALUES (%s, %s)
    """
    
    count = 0
    batch = []
    for item in vocab_data:
        vocab_id = word_to_id.get(item['word'])
        if not vocab_id:
            continue
        
        for ep_num in item['episodes']:
            episode_id = ep_to_id.get(ep_num)
            if episode_id:
                batch.append((vocab_id, episode_id))
                count += 1
        
        if len(batch) >= 1000:
            cursor.executemany(sql, batch)
            batch = []
    
    if batch:
        cursor.executemany(sql, batch)
    
    print(f"  Imported {count} associations")

def main():
    print("="*60)
    print("Russian Learning App - Data Import")
    print("="*60)
    
    # Load vocab data
    print("\nLoading vocabulary data...")
    vocab_data = load_vocab_data()
    print(f"  Loaded {len(vocab_data)} vocabulary items")
    
    # Connect to MySQL
    print("\nConnecting to MySQL...")
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("  Connected!")
    except Error as e:
        print(f"  Error: {e}")
        print("\nMake sure MySQL is running: docker-compose up -d mysql")
        return
    
    # Import data
    try:
        ep_count = import_episodes(cursor)
        conn.commit()
        
        import_vocab(cursor, vocab_data)
        conn.commit()
        
        import_vocab_episodes(cursor, vocab_data)
        conn.commit()
        
        # Update episode word counts
        print("\nUpdating episode word counts...")
        cursor.execute("""
            UPDATE episodes e 
            SET word_count = (
                SELECT COUNT(*) FROM vocab_episodes ve WHERE ve.episode_id = e.id
            )
        """)
        conn.commit()
        
        # Print summary
        cursor.execute("SELECT COUNT(*) FROM vocab")
        vocab_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM episodes")
        ep_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM vocab_episodes")
        assoc_count = cursor.fetchone()[0]
        
        print("\n" + "="*60)
        print("IMPORT COMPLETE")
        print("="*60)
        print(f"  Vocabulary: {vocab_count}")
        print(f"  Episodes: {ep_count}")
        print(f"  Associations: {assoc_count}")
        
    except Error as e:
        print(f"  Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    main()
