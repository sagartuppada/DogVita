/**
 * AI Health Assistant service - Rule-based pet health advice
 * Uses dog profile data to personalize responses
 */

import { Dog, WeightRecord, VaccinationRecord } from '../../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  quickReplies?: string[];
  action?: 'symptom_checker' | 'diet_planner' | 'feeding_schedule' | 'vet_finder';
}

export interface DogHealthContext {
  dog: Dog | null;
  latestWeight: WeightRecord | null;
  vaccinations: VaccinationRecord[];
  recentActivity?: { steps: number; activeMinutes: number };
}

// ── Conversation Context (per-session) ──

interface ConversationContext {
  recentIntents: string[];
  lastTopic: string | null;
  messageCount: number;
  mentionedSymptoms: string[];
}

const conversationCtx: ConversationContext = {
  recentIntents: [],
  lastTopic: null,
  messageCount: 0,
  mentionedSymptoms: [],
};

// ── Health Knowledge Base (expanded) ──

const KNOWLEDGE_BASE: Record<string, string[]> = {
  nutrition: [
    "A balanced diet for dogs should include high-quality protein (chicken, beef, fish), healthy fats, carbohydrates, vitamins, and minerals. Avoid onions, garlic, chocolate, grapes, and xylitol.",
    "Puppies under 6 months need 3-4 meals per day. Adult dogs typically do well with 2 meals. Senior dogs may benefit from smaller, more frequent meals.",
    "Fresh water should always be available. Dehydration can lead to serious health issues, especially in hot weather.",
    "Safe human foods for dogs include plain cooked chicken, carrots, blueberries, watermelon (seedless), and plain rice. Always introduce new foods gradually.",
    "Grain-free diets have been linked to dilated cardiomyopathy (DCM) in dogs. Unless your vet recommends it, stick with quality grain-inclusive food.",
    "Raw diets can carry bacterial risks (Salmonella, E. coli). If you choose raw, work closely with a veterinary nutritionist to ensure balanced nutrition.",
    "Dog food labels list ingredients by weight. The first ingredient should be a named protein source (e.g., 'chicken' not 'meat by-products').",
    "Overfeeding is the #1 nutritional mistake. Use a measuring cup and follow feeding guidelines based on your dog's ideal (not current) weight.",
  ],
  exercise: [
    "Most adult dogs need 30-60 minutes of exercise daily. Active breeds like Border Collies and Huskies may need 2+ hours.",
    "Puppies should have short, controlled exercise sessions. Too much running on hard surfaces can damage developing joints.",
    "Mental exercise is just as important as physical. Puzzle toys, training sessions, and scent games help prevent boredom.",
    "Swimming is excellent low-impact exercise, especially for dogs with joint issues. Always supervise around water and rinse off chlorine or salt afterward.",
    "Brachycephalic breeds (Bulldogs, Pugs) overheat easily. Exercise during cool hours and watch for excessive panting or drooling.",
    "After meals, wait at least 1 hour before vigorous exercise to reduce the risk of bloat (gastric dilatation-volvulus), which can be fatal.",
    "Hide-and-seek, tug-of-war, and nose work games provide mental stimulation without straining joints — great for rainy days.",
    "Signs your dog needs more exercise: destructive chewing, excessive barking, restlessness, weight gain, or pacing.",
  ],
  grooming: [
    "Brush your dog regularly to reduce shedding and prevent matting. Long-haired breeds may need daily brushing.",
    "Bathe your dog every 4-6 weeks, or when visibly dirty. Over-bathing can strip natural oils and cause dry skin.",
    "Check ears weekly for redness, odor, or discharge. Clean with vet-approved ear cleaner if needed.",
    "Trim nails when you can hear them clicking on hard floors. Cut at a 45-degree angle, avoiding the quick (the pink blood supply inside the nail).",
    "Dogs with wrinkly skin (Shar-Peis, Bulldogs) need their folds cleaned and dried daily to prevent yeast and bacterial infections.",
    "Anal glands may need expression if your dog is scooting or licking excessively. Your vet or groomer can do this safely.",
    "Use dog-specific shampoo only — human shampoo has a different pH that can irritate canine skin.",
    "Regular grooming sessions help you spot lumps, parasites, skin issues, or injuries early.",
  ],
  behavior: [
    "Positive reinforcement is the most effective training method. Reward good behavior with treats, praise, or play.",
    "Separation anxiety can manifest as destructive behavior, excessive barking, or house soiling. Gradual desensitization helps.",
    "Socialization is crucial for puppies. Expose them to various people, animals, sounds, and environments before 16 weeks.",
    "Destructive chewing often signals boredom or anxiety. Provide appropriate chew toys and increase mental stimulation.",
    "Excessive barking can have many causes: boredom, fear, territorial behavior, or seeking attention. Identify the trigger before addressing the behavior.",
    "Resource guarding (growling over food or toys) can be managed with desensitization training. Never punish a growl — it's a warning signal.",
    "Tail chasing or spinning can indicate allergies, pain, or OCD. If it becomes repetitive, consult your vet.",
    "Dogs don't understand punishment after the fact. Only reinforce behaviors within 1-2 seconds of them happening.",
  ],
  vaccines: [
    "Core vaccines (DHPP, Rabies) are essential for all dogs. Non-core vaccines depend on lifestyle and geographic risk.",
    "Puppy vaccination series typically starts at 6-8 weeks and continues every 3-4 weeks until 16 weeks.",
    "Adult dogs need booster shots every 1-3 years depending on the vaccine and local regulations.",
    "Bordetella (kennel cough) is recommended if your dog interacts with other dogs at daycare, boarding, or dog parks.",
    "The Leptospirosis vaccine is recommended for dogs exposed to wildlife, standing water, or rural environments.",
    "Mild vaccine reactions (lethargy, slight fever, soreness at injection site) are normal for 24-48 hours. Seek care for facial swelling, hives, or difficulty breathing.",
    "Titer tests can check if your dog still has immunity from previous vaccines, potentially avoiding unnecessary boosters.",
    "Vaccines don't provide 100% protection, but they significantly reduce the severity of diseases if your dog is exposed.",
  ],
  parasites: [
    "Fleas can cause severe itching, allergies, and anemia. Use monthly prevention year-round, even in winter.",
    "Ticks carry Lyme disease, Ehrlichiosis, and other illnesses. Check your dog after walks in wooded or grassy areas.",
    "Heartworm is transmitted by mosquitoes and can be fatal. Monthly prevention is much safer and cheaper than treatment.",
    "Roundworms are common in puppies and can be transmitted to humans. Puppies should be dewormed starting at 2 weeks of age.",
    "Tapeworm segments (white, rice-like) around the anus or in stool usually indicate flea ingestion. Treat fleas first, then deworm.",
    "Giardia is a protozoan parasite causing diarrhea. It's spread through contaminated water — avoid letting your dog drink from puddles or streams.",
    "Some topical flea treatments are less effective due to developing resistance. Ask your vet about oral preventatives (e.g., NexGard, Simparica).",
    "Natural remedies like garlic, essential oils, or diatomaceous earth are NOT safe or effective for parasite prevention. Use vet-recommended products.",
  ],
  emergency: [
    "🚨 Seek immediate vet care if your dog shows: difficulty breathing, pale gums, seizures, bloated abdomen, uncontrolled bleeding, or inability to urinate.",
    "For poisoning, contact your vet or Pet Poison Helpline immediately. Do not induce vomiting unless instructed by a professional.",
    "Heatstroke symptoms include excessive panting, drooling, lethargy, and collapse. Cool your dog gradually with wet towels and seek vet care.",
    "CPR for dogs: if no heartbeat after 1 minute of chest compressions (30 compressions, 2 breaths), rush to emergency vet.",
    "Signs of bloat (GDV): unproductive retching, swollen abdomen, restlessness, drooling. This is a life-threatening emergency — go to the vet immediately.",
    "If your dog is bleeding, apply firm pressure with a clean cloth for 5 minutes. Don't use a tourniquet unless directed by a vet.",
    "Keep activated charcoal and hydrogen peroxide out of reach. Never give human medications — acetaminophen (Tylenol) is deadly to dogs.",
    "Create a pet first aid kit: gauze, adhesive tape, hydrogen peroxide (3%), digital thermometer (normal: 101-102.5°F), tweezers, and emergency vet number.",
  ],
  dental: [
    "Dental disease affects 80% of dogs over age 3. Brush teeth daily with dog-specific toothpaste.",
    "Bad breath, yellow tartar, and red gums are signs of dental problems. Professional cleaning may be needed.",
    "Dental chews can help reduce plaque but don't replace brushing. Look for VOHC-approved products.",
    "Dental disease can lead to bacteria entering the bloodstream and affecting the heart, kidneys, and liver.",
    "Puppy teeth (deciduous) should fall out by 6 months. Retained baby teeth may need surgical extraction.",
    "Dental cleaning under anesthesia is the gold standard for removing tartar. Non-anesthetic cleanings only address visible surfaces.",
    "Avoid real bones and antlers for chewing — they can fracture teeth. Use rubber toys or dental-specific chews instead.",
    "Start dental care early in your dog's life so they become comfortable with mouth handling.",
  ],
  weight: [
    "You should be able to feel your dog's ribs without pressing hard. If not visible, your dog may be overweight.",
    "Sudden weight loss can indicate serious health issues like diabetes, kidney disease, or cancer. See your vet promptly.",
    "Weight gain often results from overfeeding or lack of exercise. Measure food portions and increase daily walks.",
    "Obese dogs have a shorter lifespan — studies show 2+ years less than dogs at ideal weight.",
    "Treats should make up no more than 10% of your dog's daily calories. A single Milk-Bone is ~30-50 calories.",
    "Weigh your dog monthly to track trends. A gain of 1-2 pounds in small breeds is significant and warrants attention.",
    "Weight loss should be gradual — aim for 1-2% of body weight per week. Rapid weight loss can cause liver problems.",
    "Some medications (steroids, certain seizure meds) can cause weight gain. Discuss alternatives with your vet.",
  ],
  sleep: [
    "Adult dogs sleep 12-14 hours per day. Puppies and seniors may sleep up to 18-20 hours.",
    "Restless sleep, frequent waking, or unusual sleeping positions can indicate pain or discomfort.",
    "Provide a comfortable, quiet sleeping area. Dogs benefit from a consistent sleep routine just like humans.",
    "Dogs cycle through light sleep, deep sleep, and REM sleep. You may notice twitching, paw movement, or muffled barks during REM — this is normal dreaming.",
    "Excessive sleeping combined with lethargy, loss of appetite, or behavior changes warrants a vet visit — it could signal hypothyroidism, depression, or illness.",
    "Napping is normal and healthy for dogs. Puppies may nap 18+ hours as their bodies and brains develop rapidly.",
    "Senior dogs often sleep more and may develop cognitive dysfunction that disrupts their sleep-wake cycle. Talk to your vet about options.",
    "Temperature affects sleep — dogs seek cool surfaces in summer and burrow under blankets in winter. Provide appropriate bedding year-round.",
  ],

  // ── New topics ──

  arthritis: [
    "Arthritis is a progressive joint disease affecting over 20% of adult dogs and up to 60% of seniors. Early signs include stiffness after rest and reluctance to jump.",
    "Anti-inflammatory medications (NSAIDs), weight management, and joint supplements form the three pillars of arthritis management.",
    "Low-impact exercise like short, frequent walks and swimming helps maintain joint mobility without causing further damage.",
    "Cold weather worsens arthritis symptoms. Provide a warm bed, use dog boots on icy surfaces, and consider a heated pad.",
  ],

  anxiety: [
    "Separation anxiety affects up to 20% of dogs. Signs include destructive behavior, excessive barking, and house soiling when left alone.",
    "Start with very short absences (seconds to minutes) and gradually increase. Reward calm behavior when you return — not anxious greetings.",
    "Calming aids like ThunderShirts, Adaptil diffusers, or calming treats (L-theanine, chamomile) can help mild anxiety.",
    "Crate training provides a safe den for anxious dogs. Make the crate a positive space with treats and comfort items — never use it as punishment.",
    "For severe anxiety, consult your vet about anti-anxiety medications (fluoxetine, trazodone). They work best combined with behavior modification.",
    "Dogs with storm phobia often respond to a safe hiding spot (closet, under a desk) plus white noise to mask thunder.",
    "Never force a fearful dog to face their trigger. Desensitization requires gradual, controlled exposure at the dog's comfort level.",
    "Changes in routine (moving, new family member, schedule changes) can trigger anxiety. Maintain consistent feeding, walking, and bedtime schedules.",
  ],
  seniorCare: [
    "Senior dogs (small breeds: 11+ years, large breeds: 7+ years) need biannual vet checkups instead of annual.",
    "Arthritis is extremely common in senior dogs. Signs include stiffness after rest, reluctance to jump, and reduced activity.",
    "Orthopedic beds, ramps for furniture/car, and non-slip rugs help senior dogs navigate their environment safely.",
    "Cognitive dysfunction syndrome (CDS) affects senior dogs — signs include disorientation, staring at walls, house soiling, and altered sleep patterns.",
    "Senior dogs may need fewer calories but higher-quality protein to maintain muscle mass. Ask your vet about senior-specific diets.",
    "Joint supplements (glucosamine, chondroitin, omega-3 fatty acids) can help manage arthritis symptoms. Start before severe stiffness sets in.",
    "Vision and hearing loss is common in aging dogs. Use hand signals for deaf dogs and keep furniture arrangement consistent for blind dogs.",
    "Watch for sudden behavior changes in seniors — they often signal pain or illness rather than 'just aging.' Always investigate.",
  ],
  puppyCare: [
    "Puppies have an immune system gap between 6-16 weeks. Avoid dog parks, pet stores, and unknown dogs until fully vaccinated.",
    "The critical socialization window is 3-16 weeks. Positive exposures now shape your puppy's behavior for life.",
    "Puppy-proof your home: secure electrical cords, remove toxic plants, block small spaces, and store chemicals out of reach.",
    "Bite inhibition is learned through play with littermates. When your puppy bites too hard, yelp loudly and stop playing briefly.",
    "Puppies need 5 minutes of exercise per month of age, twice daily. A 3-month-old puppy gets 15-minute walks, twice a day.",
    "Puppy nipping is normal but should be redirected to appropriate chew toys. Frozen washcloths soothe teething pain.",
    "Crate training a puppy: the crate should be just large enough to stand, turn around, and lie down. Add a divider that expands as they grow.",
    "Establish a routine early — consistent feeding times, potty breaks (every 1-2 hours for young puppies), and bedtime help house training.",
  ],
  skinCoat: [
    "Itchy skin can indicate allergies (food, environmental), parasites, infections, or dry skin. Persistent scratching warrants a vet visit.",
    "Hot spots (acute moist dermatitis) appear as red, oozing patches. They develop quickly and require veterinary treatment to prevent spreading.",
    "Omega-3 fatty acids (fish oil) improve coat quality and reduce inflammation from allergies. Add to food based on your dog's weight.",
    "Bald patches, redness, or scaly skin could indicate mange (mites), ringworm (fungal infection), or hypothyroidism.",
    "Seasonal shedding is normal for most breeds. Excessive hair loss or patchy shedding may indicate a health issue.",
    "Coconut oil can moisturize dry skin when applied topically, but too much in the diet can cause diarrhea. Use sparingly.",
    "Fungal infections (ringworm) are contagious to humans. If your dog has circular hair loss patches, see your vet promptly.",
    "Color changes in the skin (hyperpigmentation) can indicate chronic irritation, hormonal imbalances, or allergies.",
  ],
  jointHealth: [
    "Hip and elbow dysplasia are genetic conditions common in large breeds. Early detection through screening (OFA, PennHIP) helps manage the condition.",
    "Maintaining a lean body weight is the single most important thing you can do to protect your dog's joints.",
    "Glucosamine and chondroitin work best when started preventatively in predisposed breeds, not just after arthritis develops.",
    "Hydrotherapy (underwater treadmill or swimming) is excellent for dogs with joint problems — the buoyancy reduces stress on joints.",
    "Ramps and steps for getting in/out of cars or onto furniture reduce joint strain, especially for long-backed breeds like Dachshunds.",
    "Non-steroidal anti-inflammatory drugs (NSAIDs like carprofen or meloxicam) are commonly prescribed for joint pain. Never give human NSAIDs.",
    "Weight-bearing exercise on soft surfaces (grass, dirt) is better for joints than hard surfaces (concrete, asphalt).",
    "Signs of joint problems: limping, difficulty rising, reluctance to climb stairs, bunny-hopping gait, or crying when touched.",
  ],
  travel: [
    "Secure your dog with a crash-tested harness or in a well-ventilated crate during car travel. Loose dogs are dangerous in accidents.",
    "Bring copies of vaccination records, a current photo, and your vet's contact information when traveling with your dog.",
    "Motion sickness is common in dogs. Avoid feeding 1-2 hours before travel, ensure good ventilation, and consult your vet about anti-nausea medication.",
    "Never leave your dog alone in a parked car. Temperature can rise 20°F in 10 minutes, even with windows cracked.",
    "When flying with dogs, airlines have specific requirements for crate size, health certificates, and booking. Research well in advance.",
    "For road trips, stop every 2-3 hours for water, bathroom breaks, and short walks. Bring a portable water bowl.",
    "Pet-friendly hotels and rentals often have size restrictions. Call ahead and confirm policies before booking.",
    "ID tags with your cell phone number and an up-to-date microchip registration are essential when traveling — dogs can escape in unfamiliar environments.",
  ],
};

// ── Breed-Specific Advice (expanded) ──

const BREED_ADVICE: Record<string, string[]> = {
  'Golden Retriever': [
    "Golden Retrievers are prone to hip dysplasia, elbow dysplasia, and certain cancers. Regular vet checkups and maintaining a healthy weight are crucial.",
    "They love food and can easily become overweight. Measure portions carefully and provide plenty of exercise.",
    "Their dense double coat needs regular brushing, especially during seasonal shedding.",
    "Lymphoma and hemangiosarcoma are unfortunately common in Goldens. Know the signs: unexplained weight loss, swollen lymph nodes, or sudden weakness.",
  ],
  'Labrador Retriever': [
    "Labs are prone to obesity, hip dysplasia, and exercise-induced collapse. Keep them lean and active.",
    "They have an 'eat first, ask questions later' mentality. Use puzzle feeders to slow down eating and prevent bloat.",
    "Progressive retinal atrophy (PRA) can cause blindness. Regular eye exams are recommended.",
    "Labs are mouthy by nature — provide plenty of appropriate chew toys to redirect from shoes and furniture.",
  ],
  'German Shepherd': [
    "German Shepherds are prone to hip dysplasia, degenerative myelopathy, and bloat. Feed smaller, more frequent meals.",
    "They need significant mental stimulation. Without it, they may develop anxiety or destructive behaviors.",
    "EPI (exocrine pancreatic insufficiency) is more common in GSDs — signs include large volumes of soft stool and weight loss despite a good appetite.",
    "They bond deeply with one person but need early socialization to be comfortable with strangers and other dogs.",
  ],
  'Beagle': [
    "Beagles are prone to obesity and ear infections. Monitor weight closely and check ears weekly.",
    "Their strong nose means they'll follow scents anywhere. Always walk on a leash and ensure secure fencing.",
    "Beagles are pack dogs and don't do well when left alone for long periods. They may howl or become destructive.",
    "Their floppy ears trap moisture, making them prone to yeast infections. Keep ears clean and dry.",
  ],
  'Bulldog': [
    "Bulldogs are brachycephalic (flat-faced), making them prone to breathing difficulties. Avoid exercise in heat and humidity.",
    "Skin fold dermatitis is common. Clean facial wrinkles daily to prevent infection.",
    "They overheat easily — provide air conditioning, limit outdoor time in summer, and never exercise in midday heat.",
    "Cherry eye and other eye conditions are common. Watch for redness or a bulging mass in the corner of the eye.",
  ],
  'Poodle': [
    "Poodles are prone to Addison's disease, bloat, and hip dysplasia. Regular vet screenings are recommended.",
    "Their hair grows continuously and needs professional grooming every 6-8 weeks.",
    "Poodles are highly intelligent and need mental challenges — puzzle toys, trick training, or nose work.",
    "Sebaceous adenitis (skin condition) can occur in standard Poodles. Watch for scaly skin and hair loss.",
  ],
  'Chihuahua': [
    "Chihuahuas are prone to dental disease, patellar luxation, and hypoglycemia. Small, frequent meals help prevent low blood sugar.",
    "They feel the cold easily. Provide a warm sweater in winter and avoid prolonged outdoor time in cold weather.",
    "Molera (soft spot on the skull) is common and normal in Chihuahuas — it doesn't require treatment unless it stays open.",
    "They can be prone to aggression if not properly socialized. Early exposure to other dogs and people is important.",
  ],
  'Husky': [
    "Huskies are high-energy working dogs that need 2+ hours of exercise daily. Without it, they become destructive.",
    "They have a strong prey drive. Keep them leashed or in secure, fenced areas.",
    "Huskies are escape artists — they can jump fences, dig under barriers, and even open doors. Secure your yard thoroughly.",
    "They shed heavily twice a year ('blowing coat'). Daily brushing during these periods is essential.",
  ],
  'Pug': [
    "Pugs are brachycephalic and prone to breathing issues, eye problems, and obesity. Keep them cool and lean.",
    "Their curled tail is adorable but can hide skin fold infections. Check regularly.",
    "Pugs are prone to Pug Dog Encephalitis (PDE), an inflammatory brain condition. Watch for disorientation, seizures, or neck pain.",
    "They tend to overeat and gain weight easily — strict portion control is essential.",
  ],
  'Dachshund': [
    "Dachshunds are prone to IVDD (back problems). Avoid stairs, jumping on furniture, and obesity.",
    "Use a harness instead of a collar to reduce pressure on the neck and spine.",
    "Maintaining a healthy weight is critical — every extra pound puts more strain on their long back.",
    "Signs of back trouble: crying when picked up, reluctance to move, hunched back, or hind leg weakness. This is a neurological emergency.",
  ],
  'French Bulldog': [
    "Frenchies are brachycephalic and prone to BOAS (breathing obstruction). Avoid heat, humidity, and strenuous exercise.",
    "They're prone to cherry eye, allergies, and interdigital cysts between the toes.",
    "French Bulldogs often need C-sections for breeding due to their large heads and narrow hips.",
    "Their bat ears need regular cleaning as they trap debris and are prone to infections.",
  ],
  'Cavalier King Charles Spaniel': [
    "Cavaliers are prone to mitral valve disease (heart) and syringomyelia (brain). Annual cardiac screening is essential.",
    "They're gentle, affectionate dogs that don't do well with long periods of solitude.",
    "Ear infections are common due to their long, floppy ears. Clean weekly and keep them dry.",
    "They can gain weight easily — measure food and provide daily moderate exercise.",
  ],
  'Boxer': [
    "Boxers are prone to heart conditions (cardiomyopathy, aortic stenosis) and certain cancers. Regular cardiac screenings are important.",
    "They're energetic and playful but can develop arrhythmias. Monitor for fainting episodes or exercise intolerance.",
    "Boxers are prone to hip dysplasia and degenerative myelopathy. Keep them lean and avoid overexercising as puppies.",
    "Their short coat makes them sensitive to extreme cold. Provide a coat in winter.",
  ],
  'Rottweiler': [
    "Rottweilers are prone to hip and elbow dysplasia, cruciate ligament tears, and certain cancers.",
    "Early socialization and training are essential — they're powerful dogs that need to learn impulse control.",
    "They're prone to obesity and bloat. Feed measured portions 2-3 times daily and avoid exercise after meals.",
    "Regular health screenings for heart conditions (aortic stenosis) are recommended.",
  ],
  'Shih Tzu': [
    "Shih Tzus are brachycephalic and prone to breathing issues, eye problems, and dental disease.",
    "Their long coat requires daily brushing or regular professional grooming every 4-6 weeks.",
    "Patellar luxation (slipping kneecaps) is common. Watch for intermittent limping or skipping gait.",
    "They're generally healthy but can develop bladder stones — ensure they drink plenty of water.",
  ],
  'Border Collie': [
    "Border Collies are the most energetic breed — they need 2+ hours of intense exercise AND mental work daily.",
    "Without adequate stimulation, they develop neurotic behaviors like shadow chasing, tail spinning, and obsessive barking.",
    "They're prone to hip dysplasia, epilepsy, and Collie Eye Anomaly (CEA). Genetic testing is recommended.",
    "Their herding instinct can manifest as nipping at children's heels. Redirect this behavior early with appropriate outlets.",
  ],
  'Australian Shepherd': [
    "Aussies are prone to hip dysplasia, epilepsy, and MDR1 gene mutation (sensitivity to certain medications like ivermectin).",
    "They need vigorous daily exercise and mental challenges — agility, herding, or advanced obedience.",
    "Merle-to-merle breeding can produce double merles with serious eye and hearing defects. Know your dog's genetics.",
    "Their thick double coat sheds heavily. Regular brushing helps manage shedding and prevents matting.",
  ],
};

const FALLBACK_RESPONSES = [
  "I'm here to help with your dog's health! You can ask me about nutrition, exercise, grooming, behavior, vaccines, or common health concerns. What would you like to know?",
  "That's a great question. Based on your dog's profile, I'd recommend discussing this with your veterinarian for personalized advice. In the meantime, I can share general guidance on this topic.",
  "I care about your dog's wellbeing! While I can provide general health information, always consult your vet for specific medical concerns or emergencies.",
  "I'm not sure I have specific information about that, but I can help with nutrition, exercise, grooming, behavior, vaccines, skin/coat issues, joint health, and more. Try asking about one of those topics!",
  "Great question! While I don't have a specific answer for that, here's what I can help with: diet planning, exercise routines, grooming tips, behavior training, vaccination schedules, parasite prevention, and emergency signs. What interests you?",
];

// ── Intent Matching (expanded) ──

function matchIntent(message: string): string | null {
  const lower = message.toLowerCase();
  // Order matters: more-specific intents first to avoid keyword overlap.
  // e.g. 'anxiety' before 'behavior', 'jointHealth' before 'seniorCare',
  // 'skinCoat' before 'grooming', 'dental' before 'behavior' (chew).
  const keywords: Record<string, string[]> = {
    emergency: ['emergency', 'poison', 'toxic', 'choking', 'bleeding', 'seizure', 'bloat', 'heatstroke', 'unconscious', 'collapse', 'vomit blood', 'urgent', 'not breathing', 'cpr'],
    anxiety: ['anxious', 'anxiety', 'nervous', 'scared', 'fear', 'phobia', 'stress', 'panic', 'thunder', 'fireworks', 'alone', 'clingy', 'pant'],
    puppyCare: ['puppy', 'young dog', 'teething', 'puppy bite', 'house train', 'crate train', 'socialization window', 'baby dog'],
    seniorCare: ['senior', 'aging', 'old dog', 'elderly', 'cognitive', 'dementia', 'slowing down', 'grey muzzle'],
    jointHealth: ['joint', 'hip', 'elbow', 'dysplasia', 'limping', 'lameness', 'cruciate', 'luxating patella', 'mobility', 'glucosamine'],
    skinCoat: ['itchy', 'scratching', 'hot spot', 'bald', 'hair loss', 'rash', 'redness', 'flaky', 'dry skin', 'dandruff', 'ringworm', 'fungal'],
    travel: ['travel', 'flying', 'airline', 'hotel', 'vacation', 'road trip', 'crate training car', 'dog friendly'],
    vaccines: ['vaccine', 'vaccination', 'shot', 'rabies', 'dhpp', 'bordetella', 'booster', 'immunization', 'lepto', 'titer'],
    parasites: ['flea', 'tick', 'worm', 'heartworm', 'parasite', 'mite', 'mosquito', 'lyme', 'deworming', 'tapeworm'],
    dental: ['teeth', 'tooth', 'breath', 'dental', 'tartar', 'plaque', 'gum', 'mouth'],
    nutrition: ['food', 'eat', 'diet', 'nutrition', 'feed', 'meal', 'hungry', 'treat', 'snack', 'protein', 'calorie', 'kibble', 'raw food', 'grain free', 'homemade'],
    weight: ['weight', 'fat', 'skinny', 'thin', 'chubby', 'pudgy', 'pounds', 'kilos', 'kg', 'lb', 'ideal weight', 'bmi'],
    exercise: ['walk', 'run', 'exercise', 'play', 'active', 'activity', 'energy', 'lazy', 'hyper', 'fetch', 'park', 'swim', 'swimming', 'hike'],
    grooming: ['bath', 'brush', 'groom', 'nail', 'fur', 'hair', 'shed', 'smell', 'dirty', 'shampoo', 'trim', 'clipping'],
    behavior: ['bark', 'bite', 'aggressive', 'training', 'potty', 'pee', 'poop', 'destroy', 'whine', 'cry', 'obedience', 'recall', 'leash'],
    sleep: ['sleep', 'insomnia', 'restless', 'nap', 'bed', 'dream', 'night', 'snore'],
    arthritis: ['arthritis'],
  };

  for (const [intent, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) return intent;
  }
  return null;
}

function generatePersonalizedResponse(
  intent: string,
  context: DogHealthContext
): string {
  const { dog, latestWeight, vaccinations } = context;
  const breed = dog?.breed ?? '';

  // Pick a base response from knowledge base
  const baseResponses = KNOWLEDGE_BASE[intent] ?? FALLBACK_RESPONSES;
  let response = baseResponses[Math.floor(Math.random() * baseResponses.length)];

  // Add breed-specific advice if available
  const breedAdvice = BREED_ADVICE[breed];
  if (breedAdvice && Math.random() > 0.5) {
    const advice = breedAdvice[Math.floor(Math.random() * breedAdvice.length)];
    response += `\n\n💡 Since ${dog?.name} is a ${breed}: ${advice}`;
  }

  // Add personalized context
  if (dog && intent === 'weight' && latestWeight) {
    const idealWeight = dog.weight ?? 0;
    const currentWeight = latestWeight.weight;
    const diff = currentWeight - idealWeight;
    if (Math.abs(diff) > 1) {
      response += `\n\n📊 ${dog.name}'s current weight is ${currentWeight.toFixed(1)} ${latestWeight.weightUnit}, with a target of ${idealWeight} ${dog.weightUnit || 'kg'}. ${
        diff > 0
          ? `That's ${diff.toFixed(1)} ${latestWeight.weightUnit} above target. Consider portion control and more exercise.`
          : `That's ${Math.abs(diff).toFixed(1)} ${latestWeight.weightUnit} below target. You may need to increase food portions.`
      }`;
    }
  }

  if (dog && intent === 'vaccines' && vaccinations.length > 0) {
    const overdue = vaccinations.filter((v) => v.status === 'overdue');
    const due = vaccinations.filter((v) => v.status === 'due');
    if (overdue.length > 0) {
      response += `\n\n⚠️ ${dog.name} has ${overdue.length} overdue vaccination${overdue.length > 1 ? 's' : ''}: ${overdue.map((v) => v.name).join(', ')}. Please schedule a vet visit soon.`;
    } else if (due.length > 0) {
      response += `\n\n⏰ ${dog.name} has ${due.length} vaccination${due.length > 1 ? 's' : ''} due soon: ${due.map((v) => v.name).join(', ')}.`;
    }
  }

  if (dog && intent === 'exercise') {
    const age = dog.birthDate ? calculateAgeMonths(dog.birthDate) : 0;
    if (age < 12) {
      response += `\n\n🐕 Since ${dog.name} is still a puppy (under 1 year), keep exercise sessions short (5-10 minutes per month of age) to protect developing joints.`;
    } else if (age > 84) {
      response += `\n\n🐕 Since ${dog.name} is a senior dog, adjust exercise to gentle walks and avoid high-impact activities. Watch for signs of joint pain.`;
    }
  }

  if (dog && intent === 'seniorCare') {
    const age = dog.birthDate ? calculateAgeMonths(dog.birthDate) : 0;
    if (age < 84) {
      response += `\n\nℹ️ ${dog.name} isn't technically a senior yet (${Math.floor(age / 12)} years old), but it's great to start thinking about senior care now!`;
    } else {
      response += `\n\n🐕 ${dog.name} is ${Math.floor(age / 12)} years old — definitely in the senior category. Regular vet checkups every 6 months are especially important.`;
    }
  }

  if (dog && intent === 'puppyCare') {
    const age = dog.birthDate ? calculateAgeMonths(dog.birthDate) : 0;
    if (age >= 12) {
      response += `\n\nℹ️ ${dog.name} is ${Math.floor(age / 12)} year${Math.floor(age / 12) > 1 ? 's' : ''} old and past the puppy stage, but these tips are great for future reference!`;
    } else if (age < 4) {
      response += `\n\n🐕 At ${age} months old, ${dog.name} is in the critical socialization window. Positive exposures now are crucial for lifelong behavior.`;
    }
  }

  // Conversation context: mention follow-up if returning to same topic
  if (conversationCtx.lastTopic === intent && conversationCtx.messageCount > 1) {
    response += `\n\n💬 You asked about ${intent} earlier — here's some additional information.`;
  }

  return response;
}

function calculateAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function generateGreeting(context: DogHealthContext): string {
  const { dog } = context;
  if (!dog) {
    return "Hello! I'm your DogVita AI Health Assistant. I can help with nutrition, exercise, behavior, and general health questions for your dog. What would you like to know?";
  }

  const greetings = [
    `Hi! I'm here to help keep ${dog.name} healthy and happy. What can I assist you with today?`,
    `Hello! Ready to chat about ${dog.name}'s health? I can answer questions about nutrition, exercise, grooming, and more.`,
    `Hey there! How can I help you and ${dog.name} today? Feel free to ask about anything health-related.`,
  ];

  let greeting = greetings[Math.floor(Math.random() * greetings.length)];

  // Add quick action suggestions
  greeting += "\n\nYou can ask me about:";

  return greeting;
}

// ── Public API ──

function buildDogContextSummary(context: DogHealthContext): string {
  const parts: string[] = [];
  if (context.dog) {
    const dog = context.dog;
    parts.push(`Name: ${dog.name}, Breed: ${dog.breed}, Weight: ${dog.weight} ${dog.weightUnit || 'kg'}`);
    if (dog.birthDate) {
      const ageMonths = calculateAgeMonths(dog.birthDate);
      parts.push(`Age: ${Math.floor(ageMonths / 12)}y ${ageMonths % 12}m`);
    }
  }
  if (context.latestWeight) {
    parts.push(`Latest weight: ${context.latestWeight.weight} ${context.latestWeight.weightUnit}`);
  }
  if (context.vaccinations.length > 0) {
    const overdue = context.vaccinations.filter((v) => v.status === 'overdue');
    if (overdue.length > 0) {
      parts.push(`Overdue vaccines: ${overdue.map((v) => v.name).join(', ')}`);
    }
  }
  return parts.length > 0 ? parts.join('; ') : '';
}

export const aiService = {
  sendMessage(message: string, context: DogHealthContext): ChatMessage {
    const intent = matchIntent(message);
    let content: string;

    // Track conversation context
    conversationCtx.messageCount++;
    if (intent) {
      conversationCtx.recentIntents.push(intent);
      if (conversationCtx.recentIntents.length > 5) {
        conversationCtx.recentIntents.shift();
      }
      conversationCtx.lastTopic = intent;
    }

    if (intent) {
      content = generatePersonalizedResponse(intent, context);
    } else if (/\b(hi|hello|hey|greetings|howdy)\b/i.test(message)) {
      content = generateGreeting(context);
    } else if (/\b(bye|goodbye|see you|later)\b/i.test(message)) {
      content = "Take care! Remember, I'm always here if you have questions about your dog's health. 🐕";
    } else if (/\b(thank|thanks)\b/i.test(message)) {
      content = "You're very welcome! Keeping your dog healthy is my top priority. 🐾";
    } else {
      content = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    }

    return {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      quickReplies: getQuickReplies(intent),
    };
  },

  getInitialGreeting(context: DogHealthContext): ChatMessage {
    return {
      id: `ai_greeting_${Date.now()}`,
      role: 'assistant',
      content: generateGreeting(context),
      timestamp: new Date().toISOString(),
      quickReplies: [
        'Nutrition advice',
        'Exercise needs',
        'Grooming tips',
        'Vaccination schedule',
        'Check symptoms',
        'Diet planner',
      ],
    };
  },

  /** Reset conversation context (call on sign-out or chat clear) */
  resetContext(): void {
    conversationCtx.recentIntents = [];
    conversationCtx.lastTopic = null;
    conversationCtx.messageCount = 0;
    conversationCtx.mentionedSymptoms = [];
  },

};

function getQuickReplies(intent: string | null): string[] | undefined {
  if (!intent) {
    return ['Nutrition', 'Exercise', 'Grooming', 'Vaccines', 'Behavior', 'Emergency signs'];
  }
  const map: Record<string, string[]> = {
    nutrition: ['How much to feed?', 'Best dog food?', 'Treat recommendations', 'Weight management', 'Puppy diet', 'Raw food diet?'],
    exercise: ['How much exercise?', 'Best activities?', 'Puppy exercise', 'Senior dog exercise', 'Indoor games', 'Swimming benefits'],
    grooming: ['How often to bathe?', 'Nail trimming', 'Ear cleaning', 'Shedding control', 'Brushing tips', 'Wrinkle care'],
    behavior: ['Potty training', 'Barking solutions', 'Separation anxiety', 'Socialization', 'Aggression help', 'Resource guarding'],
    vaccines: ['Core vs non-core', 'Puppy schedule', 'Booster timing', 'Side effects', 'Rabies requirements', 'Titer testing'],
    parasites: ['Flea prevention', 'Tick removal', 'Heartworm meds', 'Natural remedies', 'Year-round need?', 'Tapeworm signs'],
    emergency: ['Poisoning help', 'Choking', 'Heatstroke', 'Bloat signs', 'When to go to ER', 'CPR for dogs'],
    dental: ['Brushing tips', 'Bad breath', 'Dental chews', 'Professional cleaning', 'Puppy teeth', 'Dental disease risks'],
    weight: ['Ideal weight?', 'Portion sizes', 'Weight loss plan', 'High-protein diet', 'Exercise for weight', 'Treat calories'],
    sleep: ['How much sleep?', 'Restless sleep', 'Sleeping position', 'Puppy sleep', 'Senior sleep', 'Night waking'],
    anxiety: ['Separation anxiety', 'Storm phobia', 'Calming aids', 'Crate training', 'Anti-anxiety meds', 'Desensitization'],
    seniorCare: ['Arthritis help', 'Cognitive decline', 'Senior diet', 'Joint supplements', 'Vision/hearing loss', 'Vet checkup schedule'],
    puppyCare: ['Socialization', 'Bite inhibition', 'House training', 'Puppy-proofing', 'Exercise limits', 'Teething help'],
    skinCoat: ['Itchy skin', 'Hot spots', 'Omega-3 benefits', 'Coat supplements', 'Fungal infections', 'Seasonal shedding'],
    jointHealth: ['Hip dysplasia', 'Glucosamine', 'Joint exercises', 'Weight management', 'Signs of pain', 'Hydrotherapy'],
    travel: ['Car safety', 'Flying with dogs', 'Pet-friendly hotels', 'Road trip tips', 'Motion sickness', 'Travel ID'],
    arthritis: ['Arthritis signs', 'Joint supplements', 'Low-impact exercise', 'Cold weather tips', 'NSAID options', 'Orthopedic beds'],
  };
  return map[intent];
}

export default aiService;
