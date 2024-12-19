import json
import lancedb

def fetch_meeting_ids():
    db = lancedb.connect("/tmp/lancedb")  # Connect to LanceDB
    if "scratch" not in db.table_names():
        return []  # Return an empty list if the table doesn't exist

    table = db.open_table("scratch")  # Open the table
    df = table.to_pandas()  # Convert to a Pandas DataFrame

    # Extract unique meeting IDs
    meeting_ids = df["meeting_id"].unique().tolist()
    return meeting_ids

if __name__ == "__main__":
    meeting_ids = fetch_meeting_ids()
    print(json.dumps(meeting_ids))  # Print as JSON for the Node.js backend to read