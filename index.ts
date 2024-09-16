// d3385c0a9ccc48bab46130343cebcd2f
import { Client } from "@notionhq/client";
import OpenAI from "openai";
import "dotenv/config";
import { ChatCompletionMessageParam } from "openai/resources";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";

// read in sentences from my notion
const blockId = "d3385c0a9ccc48bab46130343cebcd2f";
const notion = new Client({ auth: process.env.NOTION_INTEGRATION_API_KEY });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const childrenBlocks = await notion.blocks.children.list({
    block_id: blockId,
  });

  const ideas = childrenBlocks.results
    .filter((block) => "type" in block && block.type === "bulleted_list_item")
    .flatMap((bulletItemBlock) => bulletItemBlock.bulleted_list_item.rich_text)
    .filter((richTextItem) => richTextItem.plain_text.includes("IDEA"))
    .flatMap((ideas): ChatCompletionMessageParam => {
      return { content: ideas.plain_text, role: "user" };
    });

  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a social media marketing genius and a part time shit poster who will take my main ideas to generate more 6-7 detailed tweets that informative, sarcastic, and fun to increase followers and engagement for my account. The overall theme and focus will be about solopreneurship and software engineering. LIMIT the tweets to 200 characters.",
      },
      ...ideas,
    ],
    model: "gpt-4o-mini",
  });

  if (response.choices[0].message.content === null) {
    return;
  }

  const newIdeas = response.choices[0].message.content
    .split("\n")
    .filter((content) => content.trim() !== "")
    .map((idea): BlockObjectRequest => {
      return {
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              text: {
                content: idea,
              },
            },
          ],
        },
      };
    });

  await notion.blocks.children.append({
    block_id: blockId,
    children: [
      {
        heading_3: {
          rich_text: [
            {
              text: {
                content: `Tweet Creator - ${new Date().toLocaleDateString()}`,
              },
            },
          ],
        },
      },
      ...newIdeas,
    ],
  });
}

main();
