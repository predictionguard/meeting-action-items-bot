import sys
import os
import re
import nltk
from nltk.tokenize import sent_tokenize
from predictionguard import PredictionGuard
import lancedb

nltk.download("punkt")

transcript_text = sys.stdin.read().strip()

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

def prepare_data(chunks, embeddings):
    data = []
    for chunk, embed in zip(chunks, embeddings):
        temp = {"text": chunk, "vector": embed}
        data.append(temp)
    return data

def lanceDBConnection(chunks, embeddings):
    db = lancedb.connect("/tmp/lancedb")
    data = prepare_data(chunks, embeddings)
    table = db.create_table(
        "scratch",
        data=data,
        mode="overwrite",
    )
    return table

table = lanceDBConnection(chunks, embeds)
print("Vector store created successfully", file=sys.stderr)
