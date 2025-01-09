import json
import lancedb

def fetch_meeting_ids():
    db = lancedb.connect("/tmp/lancedb")  
    if "scratch" not in db.table_names():
        return []  

    table = db.open_table("scratch") 
    df = table.to_pandas()  
    meeting_dates = df["meeting_date"].unique().tolist()
    return meeting_dates

if __name__ == "__main__":
    meeting_dates = fetch_meeting_ids()
    print(json.dumps(meeting_dates)) 