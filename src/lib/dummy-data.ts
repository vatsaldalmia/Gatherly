export type Meetup = {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  members: { name: string; avatar: string; location: string }[];
  status: "upcoming" | "voting" | "past";
  area?: string;
};

export const meetups: Meetup[] = [
  {
    id: "m-101",
    name: "Sunday Brunch Crew",
    type: "Friends",
    date: "Sun, Jun 21",
    time: "11:30 AM",
    status: "upcoming",
    area: "Bandra West",
    members: [
      { name: "Aarav", avatar: "https://i.pravatar.cc/100?img=11", location: "Andheri" },
      { name: "Priya", avatar: "https://i.pravatar.cc/100?img=32", location: "Thane" },
      { name: "Rohan", avatar: "https://i.pravatar.cc/100?img=14", location: "Bandra" },
      { name: "Sara", avatar: "https://i.pravatar.cc/100?img=47", location: "Powai" },
    ],
  },
  {
    id: "m-102",
    name: "Q3 Offsite Planning",
    type: "Office",
    date: "Fri, Jun 26",
    time: "6:00 PM",
    status: "voting",
    members: [
      { name: "Neha", avatar: "https://i.pravatar.cc/100?img=5", location: "BKC" },
      { name: "Vikram", avatar: "https://i.pravatar.cc/100?img=8", location: "Lower Parel" },
      { name: "Tara", avatar: "https://i.pravatar.cc/100?img=23", location: "Worli" },
    ],
  },
  {
    id: "m-103",
    name: "Birthday Surprise for Ishita",
    type: "Birthday",
    date: "Sat, Jul 4",
    time: "8:00 PM",
    status: "voting",
    members: [
      { name: "Dev", avatar: "https://i.pravatar.cc/100?img=15", location: "Juhu" },
      { name: "Meera", avatar: "https://i.pravatar.cc/100?img=25", location: "Versova" },
      { name: "Karan", avatar: "https://i.pravatar.cc/100?img=33", location: "Dadar" },
      { name: "Anya", avatar: "https://i.pravatar.cc/100?img=44", location: "Andheri" },
      { name: "Riya", avatar: "https://i.pravatar.cc/100?img=49", location: "Kurla" },
    ],
  },
  {
    id: "m-104",
    name: "Sunday League Football",
    type: "Sports",
    date: "Sun, Jun 14",
    time: "7:00 AM",
    status: "past",
    area: "Powai",
    members: [
      { name: "Raj", avatar: "https://i.pravatar.cc/100?img=18", location: "Vikhroli" },
      { name: "Akash", avatar: "https://i.pravatar.cc/100?img=19", location: "Mulund" },
    ],
  },
];

export const areas = [
  {
    name: "Powai",
    fairness: 94,
    travelTime: 22,
    distance: 8.4,
    description: "Central lakeside hub with cafes, restaurants and great parking.",
  },
  {
    name: "Bandra West",
    fairness: 88,
    travelTime: 27,
    distance: 10.1,
    description: "Buzzing nightlife, sea-facing cafes, and walkable streets.",
  },
  {
    name: "Andheri East",
    fairness: 82,
    travelTime: 31,
    distance: 12.7,
    description: "Metro-accessible with great food courts and lounges.",
  },
  {
    name: "Lower Parel",
    fairness: 76,
    travelTime: 35,
    distance: 14.2,
    description: "Upscale dining and rooftop bars in revamped mill compounds.",
  },
];

export const venues = [
  {
    id: "v1",
    name: "Bayroute",
    category: "Restaurants",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop",
    rating: 4.7,
    address: "Hill Road, Bandra West",
    cost: "₹₹₹",
    open: true,
    tag: "Mediterranean",
  },
  {
    id: "v2",
    name: "Kala Ghoda Café",
    category: "Cafes",
    image: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&q=80&auto=format&fit=crop",
    rating: 4.6,
    address: "Ridge Road, Powai",
    cost: "₹₹",
    open: true,
    tag: "All-day breakfast",
  },
  {
    id: "v3",
    name: "Hiranandani Gardens",
    category: "Parks",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format&fit=crop",
    rating: 4.8,
    address: "Powai",
    cost: "Free",
    open: true,
    tag: "Picnic spot",
  },
  {
    id: "v4",
    name: "WeWork Vijay Diamond",
    category: "Coworking",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop",
    rating: 4.5,
    address: "Andheri East",
    cost: "₹₹₹",
    open: true,
    tag: "Day pass",
  },
  {
    id: "v5",
    name: "PVR ICON",
    category: "Entertainment",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80&auto=format&fit=crop",
    rating: 4.4,
    address: "Phoenix Marketcity, Kurla",
    cost: "₹₹",
    open: true,
    tag: "IMAX",
  },
  {
    id: "v6",
    name: "The Bombay Canteen",
    category: "Restaurants",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80&auto=format&fit=crop",
    rating: 4.8,
    address: "Kamala Mills, Lower Parel",
    cost: "₹₹₹₹",
    open: false,
    tag: "Indian",
  },
  {
    id: "v7",
    name: "Blue Tokai Coffee",
    category: "Cafes",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop",
    rating: 4.7,
    address: "Versova",
    cost: "₹₹",
    open: true,
    tag: "Specialty coffee",
  },
  {
    id: "v8",
    name: "Smaaash Gaming",
    category: "Entertainment",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80&auto=format&fit=crop",
    rating: 4.3,
    address: "Lower Parel",
    cost: "₹₹₹",
    open: true,
    tag: "Arcade",
  },
];

export const exploreCategories = [
  { name: "Cafes", emoji: "☕" },
  { name: "Restaurants", emoji: "🍽️" },
  { name: "Activities", emoji: "🎯" },
  { name: "Events", emoji: "🎟️" },
  { name: "Weekend Plans", emoji: "🌴" },
];

export const explorePlans = [
  {
    id: "e1",
    title: "Sunset kayaking at Powai Lake",
    category: "Activities",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80&auto=format&fit=crop",
    price: "₹899 / person",
    rating: 4.9,
    duration: "2 hrs",
  },
  {
    id: "e2",
    title: "Pottery & chai night",
    category: "Activities",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80&auto=format&fit=crop",
    price: "₹1,200 / person",
    rating: 4.8,
    duration: "3 hrs",
  },
  {
    id: "e3",
    title: "Old Bombay food walk",
    category: "Events",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop",
    price: "₹1,500 / person",
    rating: 4.9,
    duration: "4 hrs",
  },
  {
    id: "e4",
    title: "Indie live music at antiSOCIAL",
    category: "Events",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80&auto=format&fit=crop",
    price: "₹600 / person",
    rating: 4.6,
    duration: "All evening",
  },
  {
    id: "e5",
    title: "Brunch at The Pantry",
    category: "Restaurants",
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80&auto=format&fit=crop",
    price: "₹₹₹",
    rating: 4.7,
    duration: "90 min",
  },
  {
    id: "e6",
    title: "Lonavala day trip",
    category: "Weekend Plans",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80&auto=format&fit=crop",
    price: "From ₹2,400",
    rating: 4.8,
    duration: "Full day",
  },
];

export const testimonials = [
  {
    name: "Anjali Mehta",
    role: "Product Designer",
    avatar: "https://i.pravatar.cc/100?img=49",
    quote:
      "We used to spend 40 messages picking a cafe. Now Gatherly does it in 30 seconds. Genuinely life-changing for our group chats.",
  },
  {
    name: "Rahul Verma",
    role: "Engineering Manager",
    avatar: "https://i.pravatar.cc/100?img=15",
    quote:
      "Our team offsite planning went from a Notion doc nightmare to a single shared link. The fairness score is brilliant.",
  },
  {
    name: "Sneha Iyer",
    role: "Founder",
    avatar: "https://i.pravatar.cc/100?img=44",
    quote:
      "Beautifully designed. It feels like Linear meets Airbnb — for actually getting groups out of the house.",
  },
];

export const faqs = [
  {
    q: "How does Gatherly's fairness score work?",
    a: "We combine travel time, distance and your group's transport preferences to find areas where no one has to bear an unfair commute. The higher the score, the more balanced the meetup.",
  },
  {
    q: "Do my friends need an account to join?",
    a: "No. Anyone with the meetup link can add their location and vote. Accounts are optional and help us remember preferences over time.",
  },
  {
    q: "Which cities does Gatherly support?",
    a: "Gatherly works in any city worldwide. Recommendations are richest in major metros, but our fairness engine works everywhere maps do.",
  },
  {
    q: "Is Gatherly free?",
    a: "Yes — the core experience is free forever. Pro unlocks unlimited meetups, larger group sizes and advanced venue filters.",
  },
  {
    q: "Can I use Gatherly without creating a meetup?",
    a: "Absolutely. Explore curated cafes, activities and weekend plans solo — and turn any one of them into a group meetup in a tap.",
  },
];