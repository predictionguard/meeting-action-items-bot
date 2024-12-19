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


base_prompt = """You are an AI assistant. Your task is to understand the user question, and provide an answer using the provided contexts. The context is chunks from a standup meeting transcript where team members provide updates. 

Your answers are correct, high-quality, and written by a domain expert. If the provided context does not contain the answer, simply state, "The provided context does not have the answer."

User question: {}

Contexts:
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
