import sys
import json
import os
import re
import nltk
from nltk.tokenize import sent_tokenize
from predictionguard import PredictionGuard
import lancedb
import pandas as pd
nltk.download("punkt")

input_data = sys.stdin.read()
payload = json.loads(input_data)

meeting_id = payload.get("meeting_id")
transcript_text = payload.get("transcript")
meetingDateTime = payload.get("meetingDateTime")

client = PredictionGuard(api_key=os.getenv("PREDICTIONGUARD_API_KEY"))

def recursive_text_splitter(text, max_chunk_length=1000, overlap=100):
    result = []
    current_chunk_count = 0
    separator = ["\n", " "]
    _splits = re.split(f"({separator})", text)
    splits = [_splits[i] + _splits[i + 1] for i in range(1, len(_splits), 2)]

    for i in range(len(splits)):
        if current_chunk_count != 0:
            chunk = "".join(
                splits[
                    current_chunk_count - overlap : current_chunk_count + max_chunk_length
                ]
            )
        else:
            chunk = "".join(splits[0:max_chunk_length])

        if len(chunk) > 0:
            result.append("".join(chunk))
        current_chunk_count += max_chunk_length

    return result

chunks = recursive_text_splitter(transcript_text, max_chunk_length=100, overlap=10)
print("Number of Chunks: ", len(chunks), file=sys.stderr)

def pg_embedder(chunk):
    response = client.embeddings.create(
        model="bridgetower-large-itm-mlm-itc",
        input=[{"text": chunk}]
    )
    embed = response['data'][0]['embedding']
    return embed

embeds = []
for chunk in chunks:
    embedding = pg_embedder(chunk)
    embeds.append(embedding)

def prepare_data(chunks, embeddings, meeting_id, meetingDateTime):
    data = []
    for chunk, embed in zip(chunks, embeddings):
        temp = {
            "meeting_id": meeting_id,
            "meeting_date": meetingDateTime, 
            "text": chunk,
            "vector": embed
        }
        data.append(temp)
    return data

def lanceDBConnection(chunks, embeddings, meeting_id):
    db = lancedb.connect("/tmp/lancedb")
    data = prepare_data(chunks, embeddings, meeting_id, meetingDateTime)  
    df = pd.DataFrame(data)  # Convert to a DataFrame
    print("DataFrame Columns:", df.columns, file=sys.stderr)
    if "meeting_id" not in df.columns:
        print("Error: 'meeting_id' column is missing in the DataFrame.", file=sys.stderr)
        sys.exit(1)
    print ("table names", db.table_names())
    # Check if the table exists
    if "scratch" in db.table_names():
        print("table exists")
        table = db.open_table("scratch")
        table.add(df)  # Append new data to the existing table
    else:
        print ("table created")
        table = db.create_table("scratch", data=df, mode="create")  # Create table if it doesn't exist
    
    return table

table = lanceDBConnection(chunks, embeds, meeting_id, meetingDateTime)

print("Vector store created successfully", file=sys.stderr)
