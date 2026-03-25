import axios from "axios";

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME)}`;

export async function createLead(req, res) {
  const fields = req.body;

  if (!fields || Object.keys(fields).length === 0) {
    return res.status(400).json({ error: "No lead data provided." });
  }

  try {
    const response = await axios.post(
      AIRTABLE_API_URL,
      { records: [{ fields }] },
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const record = response.data.records[0];
    console.log(`✅ Lead saved to Airtable — ID: ${record.id}`);
    return res.status(201).json({ success: true, id: record.id });
  } catch (err) {
    const msg = err.response?.data?.error?.message ?? err.message;
    console.error("❌ Airtable error:", msg);
    return res.status(502).json({ error: "Failed to save lead.", detail: msg });
  }
}
