export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { dept } = req.body;
  if (!dept) return res.status(400).json({ error: "dept required" });

  const query = `
    query TeacherSearchQuery($text: String!, $schoolID: ID!) {
      newSearch {
        teachers(query: { text: $text, schoolID: $schoolID }, first: 20) {
          edges {
            node {
              id
              legacyId
              firstName
              lastName
              department
              avgRating
              avgDifficulty
              numRatings
              wouldTakeAgainPercent
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://www.ratemyprofessors.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic dGVzdDp0ZXN0",
        "Origin": "https://www.ratemyprofessors.com",
        "Referer": "https://www.ratemyprofessors.com/",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
      body: JSON.stringify({
        query,
        variables: { text: dept, schoolID: "U2Nob29sLTEyMzI=" },
      }),
    });

    const data = await response.json();
    const edges = data?.data?.newSearch?.teachers?.edges ?? [];
    const profs = edges
      .map(e => e.node)
      .filter(p => p.numRatings > 0)
      .sort((a, b) => b.numRatings - a.numRatings);

    res.setHeader("Cache-Control", "s-maxage=86400");
    return res.status(200).json({ profs });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
