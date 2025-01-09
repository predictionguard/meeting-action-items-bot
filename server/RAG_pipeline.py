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
print (type(payload))
meeting_id = payload.get("meeting_id")
transcript_text = payload.get("transcript")
meeting_date = payload.get("meetingDateTime")

client = PredictionGuard(api_key=os.getenv("PREDICTIONGUARD_API_KEY"))
def recursive_text_splitter(text, max_chunk_length=1000, overlap=100):
    result = []
    current_chunk_count = 0

    separator = r"[ \n]"  
    _splits = re.split(separator, text)

    splits = [split for split in _splits if split]

    while current_chunk_count < len(splits):
        if current_chunk_count != 0:
            chunk = "".join(
                splits[
                    max(0, current_chunk_count - overlap): current_chunk_count + max_chunk_length
                ]
            )
        else:
            chunk = "".join(splits[:max_chunk_length])

        if len(chunk) > 0:
            result.append(chunk)
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

def prepare_data(chunks, embeddings,meeting_id, meeting_date):
    data = []
    for chunk, embed in zip(chunks, embeddings):
        temp = {
            "meeting_id": meeting_id,
            "meeting_date": meeting_date, 
            "text": chunk,
            "vector": embed
        }
        data.append(temp)
    return data

def lanceDBConnection(chunks, embeddings, meeting_id, meeting_date):
    db = lancedb.connect("/tmp/lancedb")
    data = prepare_data(chunks, embeddings, meeting_id, meeting_date)  
    df = pd.DataFrame(data)  
    print("DataFrame Columns:", df.columns, file=sys.stderr)
    if "meeting_date" not in df.columns:
        print("Error: 'meeting_date' column is missing in the DataFrame.", file=sys.stderr)
        sys.exit(1)
    print("Table names:", db.table_names())
    if "scratch" in db.table_names():
        table = db.open_table("scratch")
        existing_columns = table.to_pandas().columns
        if set(existing_columns) != set(df.columns):
            print("Schema mismatch detected. Dropping and recreating table.", file=sys.stderr)
            db.drop_table("scratch")
            table = db.create_table("scratch", data=df, mode="create")
        else:
            print("Table exists. Adding new data.", file=sys.stderr)
            table.add(df)
    else:
        print("Table created.", file=sys.stderr)
        table = db.create_table("scratch", data=df, mode="create")
    return table

table = lanceDBConnection(chunks, embeds, meeting_id, meeting_date)
print("Vector store created successfully", file=sys.stderr)
