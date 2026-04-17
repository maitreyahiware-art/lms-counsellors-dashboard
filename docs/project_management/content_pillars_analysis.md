# API Data Analysis: Content Pillars

Based on a test fetch of 1,500 posts directly from the `social-posts/all` API endpoint, we can successfully map the live data into dynamic content pillars for the Educators Module. 

## 1. Health Condition Mapping (The "What")
The API returns a highly structured set of tags that perfectly align with your planned health tabs. Although currently, the raw tags will need to be grouped (similar to the logic in `parse_social_content.js`), the volume is very healthy:

- **Weight Management & Intermittent Fasting (Dominant)**
  - *Tags found:* `weightloss` (110+), `intermittentfasting` (43+), `weightlossdietplan`, `bodytransformation`.
  - *Insight:* This is currently the largest data pool and will heavily populate the "Weight Management" tab.
- **Gut Health & GI**
  - *Tags found:* `guthealth` (22+), `gut reset challenge`.
  - *Insight:* Very clear, dedicated content available for the "Gut & GI" health tab.
- **PCOS & Hormonal Health**
  - *Tags found:* `pcosweightloss` (15+)
  - *Insight:* Will effortlessly populate the "PCOS" and "Menopause" segments.
- **General Wellness**
  - *Tags found:* `healthylifestyle` (50+), `nutritiontips` (33+), `mindfuleating`.

*(Note: Highly specific conditions like "Thyroid" or "Cardiac" might need deeper scrolling in the database or semantic mapping to catch posts that talk about "cholesterol" or "hormones" without the exact tag).*

## 2. Content Format Pillars (The "How" / Kanban Columns)
The API provides a `postSubType` field which cleanly translates into the horizontal columns of your Kanban board.

> [!TIP]
> **Proposed Kanban Columns based on API Data:**

1. **Success Stories & Feedback (Huge Volume)**
   - API Subtypes: `Good Feedback` (460 posts), `Transformation` (63 posts), `Youtube Transformation` (43).
   - *Use Case:* Crucial for sales mentors to send to prospective clients.
2. **Education & Gyan (Articles & Tips)**
   - API Subtypes: `Gyans` (192 posts), `Dose of Gyaan` (90 posts), `Did You Know` (29).
   - *Use Case:* "Did you know" and instructional reels that explain concepts.
3. **Recipes & Diet Plans**
   - API Subtypes: `Recipe` (136 posts), `Healthy Recipe` (71), `What I eat in a day` (57).
   - *Use Case:* Highly actionable content an educator can quickly share when a client says "I am hungry and dieting."
4. **Podcasts & Long-form (External Links)**
   - API Subtypes: `Podcast Snippets` (117 posts), `Balanced Bites with Khyati Podcast` (24).
   - *Use Case:* Deeper educational material for committed clients.
5. **Challenges & Protocols**
   - API Subtypes: `Challenge` (18 posts) - *e.g., Gut Reset Challenge.*
   - *Use Case:* Structured day-by-day protocols.

## Recommendation for the Frontend
Since this API already returns a highly structured set of `tags` (for your 6 Health Tabs) and `postSubType` (for your Kanban Columns), you can theoretically bypass `social_content_clean.ts` completely in the future and fetch directly from this endpoint. 

You would simply need a mapping dictionary on the frontend to group the dozens of minor tags (e.g., `weightloss`, `intermittenfasting`, `fitnessgoals`) into your 6 Master Health Tabs.
