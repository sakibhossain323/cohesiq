import os
import json
import asyncio
from dotenv import load_dotenv
from tavily import TavilyClient
from groq import Groq

# Load environment variables
load_dotenv(dotenv_path=".env")

# Initialize clients
tavily = TavilyClient(api_key=os.environ.get("TAVILY_API_KEY"))
groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)

TOP_INFLUENCERS = [
    "Salman Muqtadir",
    "Tawhid Afridi",
    "Ayman Sadiq",
    "Raba Khan",
    "Enayet Chowdhury",
    "Rafsan TheChotobhai",
    "Shihab Hasan Neyon",
    "Shouvik Ahmed",
    "Prito Reza",
    "Khalid Farhan",
    "Jhankar Mahbub",
    "Ridy Sheikh",
    "Samzone",
    "ATC Android ToTo Company",
    "Sohags 360",
    "Antik Mahmud",
    "Petuk Couple",
    "Khudalagse",
    "Apurba",
    "Don Sumdany"
]

def generate_real_creators():
    print("Fetching top BD creators using Tavily & Groq...")
    real_creators = []
    
    for name in TOP_INFLUENCERS:
        print(f"Fetching data for {name}...")
        try:
            response = tavily.search(
                query=f"{name} Bangladeshi influencer YouTube Instagram follower count bio",
                search_depth="advanced",
                include_images=True
            )
            
            # Minify the results to save tokens
            minified_results = []
            for r in response.get('results', []):
                minified_results.append({
                    "title": r.get("title", ""),
                    "content": r.get("content", ""),
                    "url": r.get("url", "")
                })

            prompt = f"""
            Extract the real profile data for the Bangladeshi influencer "{name}" from the following search results.
            Return ONLY a valid JSON object.
            The object must have exactly these keys:
            - "display_name": "{name}"
            - "niche": string (e.g. Technology, Food, Travel, Fashion, Beauty, Lifestyle, Gaming, Education, Fitness, Entertainment)
            - "follower_count": integer (extract their real approximate follower or subscriber count. If you see '1.5M', write 1500000. If not found, estimate based on their popularity)
            - "platform": string (youtube or instagram)
            - "city": string (e.g. Dhaka)
            - "profile_photo_url": string (You MUST select the most relevant image URL from the 'Available Images' list below. DO NOT use ui-avatars or generate a fake URL. If the list is empty, just return an empty string)
            - "bio": string (1-2 sentences)

            Available Images:
            {json.dumps(response.get('images', []))}

            Search Results:
            {json.dumps(minified_results)}
            """

            chat_completion = groq.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful data extraction assistant that outputs ONLY valid JSON.",
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama-3.1-8b-instant",
                temperature=0.1,
            )
            
            content = chat_completion.choices[0].message.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].strip()
                
            creator = json.loads(content)
            real_creators.append(creator)
            print(f"Successfully extracted {name}.")
            
        except Exception as e:
            print(f"Failed to fetch or parse {name}: {e}")
            
    print(f"Extracted {len(real_creators)} real creators.")
    return real_creators

def generate_synthetic_creators(batch_num, count_per_batch=20):
    print(f"Generating synthetic creators batch {batch_num} using Groq...")
    prompt = f"""
    Generate {count_per_batch} highly realistic synthetic Bangladeshi micro and mid-tier content creators.
    Return ONLY a valid JSON array of objects.
    Each object must have exactly these keys:
    - "display_name": string (realistic Bengali names)
    - "niche": string (one of Technology, Food, Travel, Fashion, Beauty, Lifestyle, Gaming, Education, Fitness, Entertainment)
    - "follower_count": integer (between 10000 and 300000)
    - "platform": string (youtube or instagram)
    - "city": string (Dhaka, Chittagong, Sylhet, Rajshahi, etc)
    - "profile_photo_url": string (use https://ui-avatars.com/api/?name=FIRSTNAME+LASTNAME)
    - "bio": string (1-2 sentences realistic bio)
    """

    chat_completion = groq.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a helpful data extraction assistant that outputs ONLY valid JSON.",
            },
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="llama-3.1-8b-instant",
        temperature=0.8,
    )
    
    try:
        content = chat_completion.choices[0].message.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
            
        synthetic_creators = json.loads(content)
        print(f"Generated {len(synthetic_creators)} synthetic creators.")
        return synthetic_creators
    except Exception as e:
        print(f"Failed to parse Groq output for synthetic creators: {e}")
        return []

def generate_synthetic_brands():
    print("Generating synthetic brands using Groq...")
    prompt = """
    Generate 20 highly realistic synthetic or real Bangladeshi brands/companies.
    Return ONLY a valid JSON array of objects.
    Each object must have exactly these keys:
    - "name": string (e.g. Pathao, Chaldal, local fashion brands, tech startups)
    - "industry": string (one of Technology, Food, Travel, Fashion, Beauty, Lifestyle, Gaming, Education, Fitness, Entertainment)
    - "brand_category": string (one of food_beverage, stationery, edtech, electronics, fashion, sports, gaming, health_wellness, finance, telecom, media_entertainment, home_lifestyle). This is what the brand sells, not the creator content niche.
    - "description": string (short realistic company description)
    - "logo_url": string (use https://ui-avatars.com/api/?name=BRANDNAME)
    - "website": string (fake or real URL)
    """

    chat_completion = groq.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a helpful data extraction assistant that outputs ONLY valid JSON.",
            },
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="llama-3.1-8b-instant",
        temperature=0.7,
    )
    
    try:
        content = chat_completion.choices[0].message.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
            
        brands = json.loads(content)
        print(f"Generated {len(brands)} brands.")
        return brands
    except Exception as e:
        print(f"Failed to parse Groq output for brands: {e}")
        return []

if __name__ == "__main__":
    if not os.environ.get("TAVILY_API_KEY") or not os.environ.get("GROQ_API_KEY"):
        print("ERROR: TAVILY_API_KEY and GROQ_API_KEY must be set in .env")
        exit(1)
        
    real_creators_file = os.path.join(DATA_DIR, "real_creators.json")
    synthetic_creators_file = os.path.join(DATA_DIR, "synthetic_creators.json")
    
    # 1. Real creators via Tavily + Groq
    try:
        real_creators = generate_real_creators()
        if real_creators:
            with open(real_creators_file, "w", encoding="utf-8") as f:
                json.dump(real_creators, f, indent=2, ensure_ascii=False)
            print(f"Saved {len(real_creators)} real creators to real_creators.json")
    except Exception as e:
        print(f"Error during real creator generation: {e}")
    
    # 2. Synthetic creators (3 batches of 25 = 75)
    all_synth_creators = []
    for i in range(1, 4):
        try:
            synth = generate_synthetic_creators(batch_num=i, count_per_batch=25)
            if synth:
                all_synth_creators.extend(synth)
                with open(synthetic_creators_file, "w", encoding="utf-8") as f:
                    json.dump(all_synth_creators, f, indent=2, ensure_ascii=False)
                print(f"Saved synthetic batch {i}. Total synthetic creators now: {len(all_synth_creators)}")
        except Exception as e:
            print(f"Error during synthetic batch {i} generation: {e}")
        
    # 3. Brands
    try:
        brands = generate_synthetic_brands()
        if brands:
            brands_file = os.path.join(DATA_DIR, "brands.json")
            with open(brands_file, "w", encoding="utf-8") as f:
                json.dump(brands, f, indent=2, ensure_ascii=False)
            print(f"Saved {len(brands)} total brands to brands.json")
    except Exception as e:
        print(f"Error during brand generation: {e}")
