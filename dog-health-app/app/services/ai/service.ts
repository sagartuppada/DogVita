/**
 * AI Health Assistant service - Offline rule-based health knowledge engine
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

// ── Health Knowledge Base ──

const KNOWLEDGE_BASE: Record<string, string[]> = {
  nutrition: [
    "A balanced diet for dogs should include high-quality protein (chicken, beef, fish), healthy fats, carbohydrates, vitamins, and minerals. Avoid onions, garlic, chocolate, grapes, and xylitol.",
    "Puppies under 6 months need 3-4 meals per day. Adult dogs typically do well with 2 meals. Senior dogs may benefit from smaller, more frequent meals.",
    "Fresh water should always be available. Dehydration can lead to serious health issues, especially in hot weather.",
  ],
  exercise: [
    "Most adult dogs need 30-60 minutes of exercise daily. Active breeds like Border Collies and Huskies may need 2+ hours.",
    "Puppies should have short, controlled exercise sessions. Too much running on hard surfaces can damage developing joints.",
    "Mental exercise is just as important as physical. Puzzle toys, training sessions, and scent games help prevent boredom.",
  ],
  grooming: [
    "Brush your dog regularly to reduce shedding and prevent matting. Long-haired breeds may need daily brushing.",
    "Bathe your dog every 4-6 weeks, or when visibly dirty. Over-bathing can strip natural oils and cause dry skin.",
    "Check ears weekly for redness, odor, or discharge. Clean with vet-approved ear cleaner if needed.",
  ],
  behavior: [
    "Positive reinforcement is the most effective training method. Reward good behavior with treats, praise, or play.",
    "Separation anxiety can manifest as destructive behavior, excessive barking, or house soiling. Gradual desensitization helps.",
    "Socialization is crucial for puppies. Expose them to various people, animals, sounds, and environments before 16 weeks.",
  ],
  vaccines: [
    "Core vaccines (DHPP, Rabies) are essential for all dogs. Non-core vaccines depend on lifestyle and geographic risk.",
    "Puppy vaccination series typically starts at 6-8 weeks and continues every 3-4 weeks until 16 weeks.",
    "Adult dogs need booster shots every 1-3 years depending on the vaccine and local regulations.",
  ],
  parasites: [
    "Fleas can cause severe itching, allergies, and anemia. Use monthly prevention year-round, even in winter.",
    "Ticks carry Lyme disease, Ehrlichiosis, and other illnesses. Check your dog after walks in wooded or grassy areas.",
    "Heartworm is transmitted by mosquitoes and can be fatal. Monthly prevention is much safer and cheaper than treatment.",
  ],
  emergency: [
    "🚨 Seek immediate vet care if your dog shows: difficulty breathing, pale gums, seizures, bloated abdomen, uncontrolled bleeding, or inability to urinate.",
    "For poisoning, contact your vet or Pet Poison Helpline immediately. Do not induce vomiting unless instructed by a professional.",
    "Heatstroke symptoms include excessive panting, drooling, lethargy, and collapse. Cool your dog gradually with wet towels and seek vet care.",
  ],
  dental: [
    "Dental disease affects 80% of dogs over age 3. Brush teeth daily with dog-specific toothpaste.",
    "Bad breath, yellow tartar, and red gums are signs of dental problems. Professional cleaning may be needed.",
    "Dental chews can help reduce plaque but don't replace brushing. Look for VOHC-approved products.",
  ],
  weight: [
    "You should be able to feel your dog's ribs without pressing hard. If not visible, your dog may be overweight.",
    "Sudden weight loss can indicate serious health issues like diabetes, kidney disease, or cancer. See your vet promptly.",
    "Weight gain often results from overfeeding or lack of exercise. Measure food portions and increase daily walks.",
  ],
  sleep: [
    "Adult dogs sleep 12-14 hours per day. Puppies and seniors may sleep up to 18-20 hours.",
    "Restless sleep, frequent waking, or unusual sleeping positions can indicate pain or discomfort.",
    "Provide a comfortable, quiet sleeping area. Dogs benefit from a consistent sleep routine just like humans.",
  ],
};

const BREED_ADVICE: Record<string, string[]> = {
  'Golden Retriever': [
    "Golden Retrievers are prone to hip dysplasia, elbow dysplasia, and certain cancers. Regular vet checkups and maintaining a healthy weight are crucial.",
    "They love food and can easily become overweight. Measure portions carefully and provide plenty of exercise.",
    "Their dense double coat needs regular brushing, especially during seasonal shedding.",
  ],
  'Labrador Retriever': [
    "Labs are prone to obesity, hip dysplasia, and exercise-induced collapse. Keep them lean and active.",
    "They have an 'eat first, ask questions later' mentality. Use puzzle feeders to slow down eating and prevent bloat.",
  ],
  'German Shepherd': [
    "German Shepherds are prone to hip dysplasia, degenerative myelopathy, and bloat. Feed smaller, more frequent meals.",
    "They need significant mental stimulation. Without it, they may develop anxiety or destructive behaviors.",
  ],
  'Beagle': [
    "Beagles are prone to obesity and ear infections. Monitor weight closely and check ears weekly.",
    "Their strong nose means they'll follow scents anywhere. Always walk on a leash and ensure secure fencing.",
  ],
  'Bulldog': [
    "Bulldogs are brachycephalic (flat-faced), making them prone to breathing difficulties. Avoid exercise in heat and humidity.",
    "Skin fold dermatitis is common. Clean facial wrinkles daily to prevent infection.",
  ],
  'Poodle': [
    "Poodles are prone to Addison's disease, bloat, and hip dysplasia. Regular vet screenings are recommended.",
    "Their hair grows continuously and needs professional grooming every 6-8 weeks.",
  ],
  'Chihuahua': [
    "Chihuahuas are prone to dental disease, patellar luxation, and hypoglycemia. Small, frequent meals help prevent low blood sugar.",
    "They feel the cold easily. Provide a warm sweater in winter and avoid prolonged outdoor time in cold weather.",
  ],
  'Husky': [
    "Huskies are high-energy working dogs that need 2+ hours of exercise daily. Without it, they become destructive.",
    "They have a strong prey drive. Keep them leashed or in secure, fenced areas.",
  ],
  'Pug': [
    "Pugs are brachycephalic and prone to breathing issues, eye problems, and obesity. Keep them cool and lean.",
    "Their curled tail is adorable but can hide skin fold infections. Check regularly.",
  ],
  'Dachshund': [
    "Dachshunds are prone to IVDD (back problems). Avoid stairs, jumping on furniture, and obesity.",
    "Use a harness instead of a collar to reduce pressure on the neck and spine.",
  ],
};

const FALLBACK_RESPONSES = [
  "I'm here to help with your dog's health! You can ask me about nutrition, exercise, grooming, behavior, vaccines, or common health concerns. What would you like to know?",
  "That's a great question. Based on your dog's profile, I'd recommend discussing this with your veterinarian for personalized advice. In the meantime, I can share general guidance on this topic.",
  "I care about your dog's wellbeing! While I can provide general health information, always consult your vet for specific medical concerns or emergencies.",
];

// ── Intent Matching ──

function matchIntent(message: string): string | null {
  const lower = message.toLowerCase();
  const keywords: Record<string, string[]> = {
    nutrition: ['food', 'eat', 'diet', 'nutrition', 'feed', 'meal', 'hungry', 'treat', 'snack', 'protein', 'calorie', 'overweight', 'underweight', 'obese', 'weight loss'],
    exercise: ['walk', 'run', 'exercise', 'play', 'active', 'activity', 'energy', 'tired', 'lazy', 'hyper', 'fetch', 'park'],
    grooming: ['bath', 'brush', 'groom', 'nail', 'fur', 'coat', 'hair', 'shed', 'clean', 'smell', 'dirty', 'shampoo'],
    behavior: ['bark', 'bite', 'aggressive', 'anxiety', 'training', 'potty', 'pee', 'poop', 'destroy', 'chew', 'whine', 'cry', 'social'],
    vaccines: ['vaccine', 'vaccination', 'shot', 'rabies', 'dhpp', 'bordetella', 'booster', 'immunization'],
    parasites: ['flea', 'tick', 'worm', 'heartworm', 'parasite', 'mite', 'mosquito', 'lyme'],
    emergency: ['emergency', 'poison', 'toxic', 'choking', 'bleeding', 'seizure', 'bloat', 'heatstroke', 'unconscious', 'collapse', 'vomit blood', 'urgent'],
    dental: ['teeth', 'tooth', 'breath', 'dental', 'tartar', 'plaque', 'gum', 'mouth', 'chew'],
    weight: ['weight', 'fat', 'skinny', 'thin', 'chubby', 'pudgy', 'overweight', 'underweight', 'obese', 'pounds', 'kilos', 'kg', 'lb'],
    sleep: ['sleep', 'insomnia', 'restless', 'nap', 'tired', 'bed', 'dream', 'night', 'snore'],
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

export const aiService = {
  sendMessage(message: string, context: DogHealthContext): ChatMessage {
    const intent = matchIntent(message);
    let content: string;

    if (intent) {
      content = generatePersonalizedResponse(intent, context);
    } else if (/\b(hi|hello|hey|greetings|howdy)\b/i.test(message)) {
      content = generateGreeting(context);
    } else if (/\b(bye|goodbye|see you|later)\b/i.test(message)) {
      content = "Take care! Remember, I'm always here if you have questions about your dog's health. 🐕";
    } else if (/\b(thank|thanks)\b/i.test(message)) {
      content = "You're very welcome! Keeping your dog healthy is my top priority. 🐾";
    } else {
      content = FALLBACK_RESPONSES[0];
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
};

function getQuickReplies(intent: string | null): string[] | undefined {
  if (!intent) {
    return ['Nutrition', 'Exercise', 'Grooming', 'Vaccines', 'Behavior', 'Emergency signs'];
  }
  const map: Record<string, string[]> = {
    nutrition: ['How much to feed?', 'Best dog food?', 'Treat recommendations', 'Weight management', 'Puppy diet'],
    exercise: ['How much exercise?', 'Best activities?', 'Puppy exercise', 'Senior dog exercise', 'Indoor games'],
    grooming: ['How often to bathe?', 'Nail trimming', 'Ear cleaning', 'Shedding control', 'Brushing tips'],
    behavior: ['Potty training', 'Barking solutions', 'Separation anxiety', 'Socialization', 'Aggression help'],
    vaccines: ['Core vs non-core', 'Puppy schedule', 'Booster timing', 'Side effects', 'Rabies requirements'],
    parasites: ['Flea prevention', 'Tick removal', 'Heartworm meds', 'Natural remedies', 'Year-round need?'],
    emergency: ['Poisoning help', 'Choking', 'Heatstroke', 'Bloat signs', 'When to go to ER'],
    dental: ['Brushing tips', 'Bad breath', 'Dental chews', 'Professional cleaning', 'Puppy teeth'],
    weight: ['Ideal weight?', 'Portion sizes', 'Weight loss plan', 'High-protein diet', 'Exercise for weight'],
    sleep: ['How much sleep?', 'Restless sleep', 'Sleeping position', 'Puppy sleep', 'Senior sleep'],
  };
  return map[intent];
}

export default aiService;
