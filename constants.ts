import { Scenario, VocabularyWord } from './types';

export const PREDEFINED_SCENARIOS: Scenario[] = [
  {
    id: 'coffee-shop',
    title: 'Ordering Coffee',
    description: 'Order your favorite drink with specific customizations.',
    emoji: '☕',
    aiRole: 'Barista',
    userRole: 'Customer',
    difficulty: 'Beginner',
    initialMessage: "Hi! Welcome to Bean & Brew. What can I get started for you today?"
  },
  {
    id: 'job-interview',
    title: 'Job Interview',
    description: 'Answer common questions for a professional role.',
    emoji: '💼',
    aiRole: 'Hiring Manager',
    userRole: 'Candidate',
    difficulty: 'Advanced',
    initialMessage: "Good morning. Thank you for coming. Could you tell me a little about yourself?"
  },
  {
    id: 'airport-checkin',
    title: 'Airport Check-in',
    description: 'Check in for a flight and ask about luggage.',
    emoji: '✈️',
    aiRole: 'Airline Agent',
    userRole: 'Traveler',
    difficulty: 'Intermediate',
    initialMessage: "Hello! May I see your passport and ticket, please?"
  },
  {
    id: 'hotel-complaint',
    title: 'Hotel Complaint',
    description: 'Politely complain about a noisy room.',
    emoji: 'bell',
    aiRole: 'Receptionist',
    userRole: 'Guest',
    difficulty: 'Intermediate',
    initialMessage: "Good evening. How can I help you, sir/madam?"
  },
  {
    id: 'making-friends',
    title: 'Making Friends',
    description: 'Casual chat with a stranger at a park.',
    emoji: '🌳',
    aiRole: 'Friendly Stranger',
    userRole: 'You',
    difficulty: 'Beginner',
    initialMessage: "Beautiful weather today, isn't it? Do you come here often?"
  },
  {
    id: 'doctor-visit',
    title: 'Seeing a Doctor',
    description: 'Describe your symptoms and ask for advice.',
    emoji: '🩺',
    aiRole: 'Doctor',
    userRole: 'Patient',
    difficulty: 'Intermediate',
    initialMessage: "Hello. I see you're not feeling well today. What seems to be the problem?"
  },
  {
    id: 'shopping-clothes',
    title: 'Buying Clothes',
    description: 'Ask for sizes and try on different items.',
    emoji: '👕',
    aiRole: 'Shop Assistant',
    userRole: 'Shopper',
    difficulty: 'Beginner',
    initialMessage: "Hi there! Let me know if you need help finding a specific size."
  },
  {
    id: 'asking-directions',
    title: 'Asking Directions',
    description: 'You are lost. Ask a local for help.',
    emoji: '🗺️',
    aiRole: 'Local Resident',
    userRole: 'Tourist',
    difficulty: 'Beginner',
    initialMessage: "Excuse me? You look a bit lost. Can I help you find something?"
  },
  {
    id: 'restaurant-order',
    title: 'Dinner Reservation',
    description: 'Book a table and ask about the menu.',
    emoji: '🍽️',
    aiRole: 'Host',
    userRole: 'Customer',
    difficulty: 'Intermediate',
    initialMessage: "Good evening, welcome to La Luna. Do you have a reservation?"
  },
  {
    id: 'rent-apartment',
    title: 'Renting a Flat',
    description: 'Ask a landlord about rent, utilities, and rules.',
    emoji: '🏠',
    aiRole: 'Landlord',
    userRole: 'Tenant',
    difficulty: 'Advanced',
    initialMessage: "Hi! Thanks for coming to view the apartment. What do you think of the space?"
  },
  {
    id: 'grocery-store',
    title: 'Supermarket',
    description: 'Checkout groceries and ask for a bag.',
    emoji: '🛒',
    aiRole: 'Cashier',
    userRole: 'Customer',
    difficulty: 'Beginner',
    initialMessage: "Hello! Did you find everything you were looking for today?"
  },
  {
    id: 'tech-support',
    title: 'IT Support',
    description: 'Explain a problem with your laptop.',
    emoji: '💻',
    aiRole: 'Tech Support',
    userRole: 'User',
    difficulty: 'Intermediate',
    initialMessage: "Tech Support, this is Sarah. What issue are you experiencing with your device?"
  },
  {
    id: 'haircut',
    title: 'Getting a Haircut',
    description: 'Explain the hairstyle you want.',
    emoji: '✂️',
    aiRole: 'Barber',
    userRole: 'Customer',
    difficulty: 'Intermediate',
    initialMessage: "Hey! Take a seat. What are we doing with your hair today?"
  },
  {
    id: 'refund-item',
    title: 'Returning Item',
    description: 'Return a defective product for a refund.',
    emoji: '📦',
    aiRole: 'Customer Service',
    userRole: 'Customer',
    difficulty: 'Advanced',
    initialMessage: "Customer Service. Do you have your receipt with you?"
  },
  {
    id: 'taxi-ride',
    title: 'Taxi Ride',
    description: 'Give directions and chat with the driver.',
    emoji: '🚖',
    aiRole: 'Driver',
    userRole: 'Passenger',
    difficulty: 'Beginner',
    initialMessage: "Hop in! Where are we heading to today?"
  }
];

export const INITIAL_VOCAB: VocabularyWord[] = [
  {
    id: '1',
    word: 'Latte',
    definition: 'A type of coffee made with espresso and hot steamed milk.',
    context: 'I would like a large latte, please.',
    addedAt: Date.now(),
    phonetic: '/ˈlɑː.teɪ/',
    partOfSpeech: 'n.',
    chineseDefinition: '拿铁咖啡',
    exampleSentence: 'She ordered a skinny latte with no sugar.',
    exampleTranslation: '她点了一杯不加糖的脱脂拿铁。',
    synonyms: ['coffee', 'espresso', 'brew'],
    roots: 'From Italian "caffè latte" (milk coffee).'
  }
];