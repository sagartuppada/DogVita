/**
 * Lightweight knowledge retrieval for augmenting the on-device LLM.
 * Matches user queries against a curated dog health knowledge base
 * and returns relevant entries to inject as prompt context.
 */

const TOPIC_KEYWORDS: Record<string, string[]> = {
  nutrition: ['food', 'eat', 'diet', 'nutrition', 'feed', 'meal', 'hungry', 'treat', 'kibble', 'raw food', 'grain free'],
  exercise: ['walk', 'run', 'exercise', 'play', 'active', 'energy', 'fetch', 'park', 'swim', 'hike'],
  grooming: ['bath', 'brush', 'groom', 'nail', 'fur', 'shed', 'shampoo', 'trim'],
  behavior: ['bark', 'bite', 'aggressive', 'training', 'potty', 'destroy', 'whine', 'obedience', 'leash'],
  vaccines: ['vaccine', 'vaccination', 'shot', 'rabies', 'dhpp', 'bordetella', 'booster', 'titer'],
  parasites: ['flea', 'tick', 'worm', 'heartworm', 'parasite', 'deworming'],
  emergency: ['emergency', 'poison', 'toxic', 'choking', 'bleeding', 'seizure', 'bloat', 'heatstroke', 'collapse', 'urgent'],
  dental: ['teeth', 'tooth', 'breath', 'dental', 'tartar', 'plaque', 'gum'],
  weight: ['weight', 'fat', 'skinny', 'overweight', 'obese', 'portion', 'calorie'],
  skin: ['itchy', 'scratching', 'hot spot', 'bald', 'hair loss', 'rash', 'dry skin', 'ringworm'],
  joints: ['joint', 'hip', 'elbow', 'dysplasia', 'limping', 'arthritis', 'mobility', 'glucosamine'],
  anxiety: ['anxious', 'anxiety', 'nervous', 'scared', 'fear', 'stress', 'separation', 'thunder', 'fireworks'],
  puppy: ['puppy', 'teething', 'socialization', 'house train', 'crate train', 'puppy bite'],
  senior: ['senior', 'aging', 'old dog', 'cognitive', 'dementia'],
  sleep: ['sleep', 'insomnia', 'restless', 'nap', 'dream', 'snore'],
  travel: ['travel', 'flying', 'airline', 'hotel', 'road trip', 'car'],
};

const KNOWLEDGE_BASE: Record<string, string[]> = {
  nutrition: [
    'A balanced diet for dogs should include high-quality protein, healthy fats, carbohydrates, vitamins, and minerals. Avoid onions, garlic, chocolate, grapes, and xylitol.',
    'Puppies under 6 months need 3-4 meals per day. Adult dogs typically do well with 2 meals.',
    'Overfeeding is the #1 nutritional mistake. Use a measuring cup and follow feeding guidelines based on ideal weight.',
    'Safe human foods for dogs include plain cooked chicken, carrots, blueberries, and plain rice.',
  ],
  exercise: [
    'Most adult dogs need 30-60 minutes of exercise daily. Active breeds may need 2+ hours.',
    'Mental exercise is just as important as physical. Puzzle toys and scent games help prevent boredom.',
    'After meals, wait at least 1 hour before vigorous exercise to reduce bloat risk.',
    'Signs your dog needs more exercise: destructive chewing, excessive barking, restlessness, weight gain.',
  ],
  grooming: [
    'Brush your dog regularly to reduce shedding and prevent matting. Long-haired breeds may need daily brushing.',
    'Bathe your dog every 4-6 weeks. Over-bathing can strip natural oils and cause dry skin.',
    'Trim nails when you can hear them clicking on hard floors. Cut at a 45-degree angle, avoiding the quick.',
    'Check ears weekly for redness, odor, or discharge. Clean with vet-approved ear cleaner if needed.',
  ],
  behavior: [
    'Positive reinforcement is the most effective training method. Reward good behavior with treats, praise, or play.',
    'Separation anxiety can manifest as destructive behavior, excessive barking, or house soiling.',
    'Destructive chewing often signals boredom or anxiety. Provide appropriate chew toys and increase mental stimulation.',
    'Dogs don\'t understand punishment after the fact. Only reinforce behaviors within 1-2 seconds of them happening.',
  ],
  vaccines: [
    'Core vaccines (DHPP, Rabies) are essential for all dogs. Non-core vaccines depend on lifestyle.',
    'Puppy vaccination series typically starts at 6-8 weeks and continues every 3-4 weeks until 16 weeks.',
    'Adult dogs need booster shots every 1-3 years depending on the vaccine and local regulations.',
    'Mild vaccine reactions (lethargy, slight fever) are normal for 24-48 hours. Seek care for facial swelling or hives.',
  ],
  parasites: [
    'Fleas can cause severe itching, allergies, and anemia. Use monthly prevention year-round.',
    'Heartworm is transmitted by mosquitoes and can be fatal. Monthly prevention is much safer and cheaper than treatment.',
    'Ticks carry Lyme disease and other illnesses. Check your dog after walks in wooded or grassy areas.',
    'Natural remedies like garlic or essential oils are NOT safe or effective for parasite prevention.',
  ],
  emergency: [
    'Seek immediate vet care for: difficulty breathing, pale gums, seizures, bloated abdomen, uncontrolled bleeding.',
    'For poisoning, contact your vet or Pet Poison Helpline immediately. Do not induce vomiting unless instructed.',
    'Heatstroke symptoms: excessive panting, drooling, lethargy, collapse. Cool gradually with wet towels and seek vet care.',
    'Signs of bloat: unproductive retching, swollen abdomen, restlessness. This is life-threatening — go to the vet immediately.',
  ],
  dental: [
    'Dental disease affects 80% of dogs over age 3. Brush teeth daily with dog-specific toothpaste.',
    'Bad breath, yellow tartar, and red gums are signs of dental problems. Professional cleaning may be needed.',
    'Dental disease can lead to bacteria entering the bloodstream and affecting the heart, kidneys, and liver.',
    'Avoid real bones and antlers for chewing — they can fracture teeth. Use rubber toys or dental chews instead.',
  ],
  weight: [
    'You should be able to feel your dog\'s ribs without pressing hard. If not visible, your dog may be overweight.',
    'Obese dogs have a shorter lifespan — studies show 2+ years less than dogs at ideal weight.',
    'Treats should make up no more than 10% of your dog\'s daily calories.',
    'Weight loss should be gradual — aim for 1-2% of body weight per week.',
  ],
  skin: [
    'Itchy skin can indicate allergies, parasites, infections, or dry skin. Persistent scratching warrants a vet visit.',
    'Hot spots appear as red, oozing patches. They develop quickly and require veterinary treatment.',
    'Omega-3 fatty acids improve coat quality and reduce inflammation from allergies.',
    'Bald patches or scaly skin could indicate mange, ringworm, or hypothyroidism.',
  ],
  joints: [
    'Hip and elbow dysplasia are genetic conditions common in large breeds. Early screening helps.',
    'Maintaining a lean body weight is the single most important thing for protecting your dog\'s joints.',
    'Glucosamine and chondroitin work best when started preventatively in predisposed breeds.',
    'Signs of joint problems: limping, difficulty rising, reluctance to climb stairs, bunny-hopping gait.',
  ],
  anxiety: [
    'Separation anxiety affects up to 20% of dogs. Signs include destructive behavior and excessive barking when left alone.',
    'Start with very short absences and gradually increase. Reward calm behavior when you return.',
    'Calming aids like ThunderShirts or Adaptil diffusers can help mild anxiety.',
    'For severe anxiety, consult your vet about anti-anxiety medications combined with behavior modification.',
  ],
  puppy: [
    'Puppies have an immune system gap between 6-16 weeks. Avoid dog parks until fully vaccinated.',
    'The critical socialization window is 3-16 weeks. Positive exposures now shape lifelong behavior.',
    'Puppies need 5 minutes of exercise per month of age, twice daily.',
    'Crate training: the crate should be just large enough to stand, turn around, and lie down.',
  ],
  senior: [
    'Senior dogs need biannual vet checkups instead of annual.',
    'Cognitive dysfunction syndrome causes disorientation, staring at walls, house soiling, and altered sleep patterns.',
    'Orthopedic beds, ramps, and non-slip rugs help senior dogs navigate safely.',
    'Sudden behavior changes in seniors often signal pain or illness rather than "just aging."',
  ],
  sleep: [
    'Adult dogs sleep 12-14 hours per day. Puppies and seniors may sleep up to 18-20 hours.',
    'Restless sleep or frequent waking can indicate pain or discomfort.',
    'Excessive sleeping combined with lethargy warrants a vet visit — it could signal hypothyroidism or illness.',
  ],
  travel: [
    'Secure your dog with a crash-tested harness or crate during car travel.',
    'Bring copies of vaccination records and your vet\'s contact information when traveling.',
    'Never leave your dog alone in a parked car. Temperature can rise 20°F in 10 minutes.',
    'Stop every 2-3 hours for water, bathroom breaks, and short walks on road trips.',
  ],
};

const BREED_ADVICE: Record<string, string[]> = {
  'Golden Retriever': [
    'Prone to hip dysplasia and certain cancers. Regular vet checkups and healthy weight are crucial.',
    'They love food and can easily become overweight. Measure portions carefully.',
  ],
  'Labrador Retriever': [
    'Prone to obesity, hip dysplasia, and exercise-induced collapse. Keep them lean and active.',
    'Use puzzle feeders to slow down eating and prevent bloat.',
  ],
  'German Shepherd': [
    'Prone to hip dysplasia, degenerative myelopathy, and bloat. Feed smaller, more frequent meals.',
    'They need significant mental stimulation. Without it, they may develop anxiety.',
  ],
  'Bulldog': [
    'Brachycephalic — prone to breathing difficulties. Avoid exercise in heat and humidity.',
    'Clean facial wrinkles daily to prevent skin fold dermatitis.',
  ],
  'Poodle': [
    'Prone to Addison\'s disease, bloat, and hip dysplasia. Regular vet screenings recommended.',
    'Highly intelligent — needs mental challenges like puzzle toys or trick training.',
  ],
  'Husky': [
    'High-energy working dogs needing 2+ hours of exercise daily. Without it, they become destructive.',
    'Escape artists — they can jump fences and dig under barriers. Secure your yard.',
  ],
  'Dachshund': [
    'Prone to IVDD (back problems). Avoid stairs, jumping on furniture, and obesity.',
    'Use a harness instead of a collar to reduce pressure on neck and spine.',
  ],
  'French Bulldog': [
    'Brachycephalic — prone to breathing obstruction. Avoid heat and strenuous exercise.',
    'Prone to cherry eye, allergies, and interdigital cysts.',
  ],
  'Border Collie': [
    'Most energetic breed — needs 2+ hours of intense exercise AND mental work daily.',
    'Prone to hip dysplasia, epilepsy, and Collie Eye Anomaly.',
  ],
};

const MAX_ENTRIES = 3;

export function getKnowledgeContext(query: string, breed?: string): string | null {
  const lower = query.toLowerCase();
  const matchedTopics: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matchedTopics.push(topic);
    }
  }

  if (matchedTopics.length === 0 && !breed) return null;

  const entries: string[] = [];

  for (const topic of matchedTopics.slice(0, 2)) {
    const facts = KNOWLEDGE_BASE[topic];
    if (facts) {
      const picked = facts.slice(0, MAX_ENTRIES);
      entries.push(...picked);
    }
  }

  if (breed) {
    const advice = BREED_ADVICE[breed];
    if (advice) {
      entries.push(`Breed-specific (${breed}): ${advice[0]}`);
    }
  }

  if (entries.length === 0) return null;

  return 'Relevant expert knowledge to reference in your answer:\n' +
    entries.map((e) => `- ${e}`).join('\n');
}
