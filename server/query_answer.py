import sys
import os
import lancedb
from predictionguard import PredictionGuard
import nltk
import json
import numpy as np

client = PredictionGuard(api_key=os.getenv("PREDICTIONGUARD_API_KEY"))
#question = "Summarize the updates from each person"
question = sys.stdin.read().strip()


db = lancedb.connect("/tmp/lancedb")
table = db.open_table("scratch")

# to fetcht the meeting ids
def fetch_meeting_ids():
    db = lancedb.connect("/tmp/lancedb")  # Connect to LanceDB
    if "scratch" not in db.table_names():
        return []  # Return an empty list if the table doesn't exist

    table = db.open_table("scratch")  # Open the table
    df = table.to_pandas()  # Convert to a Pandas DataFrame

    # Extract unique meeting IDs
    meeting_ids = df["meeting_id"].unique().tolist()
    return meeting_ids

def pg_embedder(chunk):
    response = client.embeddings.create(
        model="bridgetower-large-itm-mlm-itc",
        input=[{"text": chunk}]
    )
    embed = response['data'][0]['embedding']
    return embed


query_embedding = pg_embedder(question)
 

k = 5
result = table.search(query_embedding).limit(k).to_list()
context = [r["text"] for r in result]


base_prompt = """Provide answer to the user question based on the context

User question: {}

Context:
{}
"""

# MODIFIED FOR TESTING
#prompt = base_prompt.format(question, context)
prompt = f"{base_prompt.format(question, context)}"
#print (prompt)
messages = [
    {"role": "system", "content": prompt}
]

response = client.chat.completions.create(
    model="Hermes-3-Llama-3.1-8B",
    messages=messages
)

bot_response = response['choices'][0]['message']['content'].strip()


print(bot_response)
