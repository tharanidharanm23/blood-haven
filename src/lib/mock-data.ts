export type BloodGroup = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";
export type Urgency = "Normal" | "Urgent" | "Critical";
export type Role = "donor" | "hospital" | "admin";
export type District =
  | "Ariyalur"
  | "Chengalpattu"
  | "Chennai"
  | "Coimbatore"
  | "Cuddalore"
  | "Dharmapuri"
  | "Dindigul"
  | "Erode"
  | "Kallakurichi"
  | "Kancheepuram"
  | "Kanniyakumari"
  | "Karur"
  | "Krishnagiri"
  | "Madurai"
  | "Mayiladuthurai"
  | "Nagapattinam"
  | "Namakkal"
  | "Nilgiris"
  | "Perambalur"
  | "Pudukkottai"
  | "Ramanathapuram"
  | "Ranipet"
  | "Salem"
  | "Sivaganga"
  | "Tenkasi"
  | "Thanjavur"
  | "Theni"
  | "Thoothukudi"
  | "Tiruchirappalli"
  | "Tirunelveli"
  | "Tirupathur"
  | "Tiruppur"
  | "Tiruvallur"
  | "Tiruvannamalai"
  | "Tiruvarur"
  | "Vellore"
  | "Viluppuram"
  | "Virudhunagar";

export const BLOOD_GROUPS: BloodGroup[] = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
export const TAMIL_NADU_DISTRICTS: District[] = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kancheepuram",
  "Kanniyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

export const DISTRICT_CONSTITUENCIES: Record<District, string[]> = {
  Ariyalur: ["Ariyalur", "Jayankondam"],
  Chengalpattu: [
    "Chengalpattu",
    "Thiruporur",
    "Cheyyur (SC)",
    "Madurantakam (SC)",
    "Tambaram",
    "Pallavaram",
    "Sholinganallur",
  ],
  Chennai: [
    "Kolathur",
    "Villivakkam",
    "Thiru-Vi-Ka-Nagar (SC)",
    "Egmore (SC)",
    "Royapuram",
    "Harbour",
    "Chepauk-Thiruvallikeni",
    "Thousand Lights",
    "Anna Nagar",
    "Virugambakkam",
    "Saidapet",
    "T. Nagar",
    "Mylapore",
    "Velachery",
    "Perambur",
    "Ambattur",
  ],
  Coimbatore: [
    "Coimbatore North",
    "Coimbatore South",
    "Kavundampalayam",
    "Singanallur",
    "Sulur",
    "Pollachi",
    "Kinathukadavu",
    "Valparai (SC)",
    "Thondamuthur",
  ],
  Cuddalore: [
    "Cuddalore",
    "Neyveli",
    "Panruti",
    "Kurinjipadi",
    "Bhuvanagiri",
    "Chidambaram",
    "Kattumannarkoil (SC)",
  ],
  Dharmapuri: ["Dharmapuri", "Pennagaram", "Palacode", "Pappireddippatti", "Harur (SC)"],
  Dindigul: [
    "Dindigul",
    "Athoor",
    "Nilakottai (SC)",
    "Oddanchatram",
    "Palani",
    "Vedasandur",
    "Natham",
  ],
  Erode: [
    "Erode East",
    "Erode West",
    "Modakkurichi",
    "Perundurai",
    "Bhavani",
    "Anthiyur",
    "Gobichettipalayam",
  ],
  Kallakurichi: ["Kallakurichi (SC)", "Sankarapuram", "Rishivandiyam", "Ulundurpettai"],
  Kancheepuram: ["Kancheepuram", "Uthiramerur", "Sriperumbudur (SC)"],
  Kanniyakumari: [
    "Kanniyakumari",
    "Nagercoil",
    "Colachel",
    "Padmanabhapuram",
    "Vilavancode",
    "Killiyoor",
  ],
  Karur: ["Karur", "Krishnarayapuram (SC)", "Kulithalai"],
  Krishnagiri: ["Krishnagiri", "Bargur", "Hosur", "Thalli", "Uthangarai (SC)"],
  Madurai: [
    "Madurai North",
    "Madurai South",
    "Madurai Central",
    "Madurai East",
    "Madurai West",
    "Thirumangalam",
    "Thiruparankundram",
    "Usilampatti",
    "Sholavandan (SC)",
    "Melur",
  ],
  Mayiladuthurai: ["Mayiladuthurai", "Poompuhar", "Sirkazhi (SC)"],
  Nagapattinam: ["Nagapattinam", "Kilvelur (SC)", "Vedaranyam"],
  Namakkal: ["Namakkal", "Rasipuram (SC)", "Senthamangalam (ST)", "Tiruchengode", "Kumarapalayam"],
  Nilgiris: ["Udhagamandalam", "Gudalur (SC)", "Coonoor"],
  Perambalur: ["Perambalur (SC)", "Kunnam"],
  Pudukkottai: [
    "Pudukkottai",
    "Thirumayam",
    "Alangudi",
    "Aranthangi",
    "Gandarvakottai (SC)",
    "Viralimalai",
  ],
  Ramanathapuram: ["Ramanathapuram", "Paramakudi (SC)", "Tiruvadanai", "Mudhukulathur"],
  Ranipet: ["Ranipet", "Arcot", "Sholingur", "Arakkonam (SC)"],
  Salem: [
    "Salem North",
    "Salem South",
    "Salem West",
    "Veerapandi",
    "Omalur",
    "Edappadi",
    "Yercaud (ST)",
  ],
  Sivaganga: ["Sivaganga", "Karaikudi", "Tiruppattur", "Manamadurai (SC)"],
  Tenkasi: ["Tenkasi", "Kadayanallur", "Alangulam", "Vasudevanallur (SC)", "Sankarankovil (SC)"],
  Thanjavur: [
    "Thanjavur",
    "Orathanadu",
    "Papanasam",
    "Kumbakonam",
    "Thiruvidaimarudur (SC)",
    "Pattukkottai",
    "Peravurani",
  ],
  Theni: ["Theni", "Periyakulam (SC)", "Bodinayakanur", "Cumbum"],
  Thoothukudi: [
    "Thoothukudi",
    "Tiruchendur",
    "Srivaikuntam",
    "Ottapidaram (SC)",
    "Kovilpatti",
    "Vilathikulam",
  ],
  Tiruchirappalli: [
    "Srirangam",
    "Tiruchirappalli West",
    "Tiruchirappalli East",
    "Thiruverumbur",
    "Lalgudi",
    "Manachanallur",
    "Musiri",
    "Thuraiyur (SC)",
    "Manapparai",
  ],
  Tirunelveli: ["Tirunelveli", "Palayamkottai", "Ambasamudram", "Nanguneri", "Radhapuram"],
  Tirupathur: ["Tirupathur", "Jolarpet", "Vaniyambadi", "Ambur"],
  Tiruppur: [
    "Tiruppur North",
    "Tiruppur South",
    "Avinashi (SC)",
    "Palladam",
    "Udumalaipettai",
    "Dharapuram (SC)",
    "Kangayam",
  ],
  Tiruvallur: [
    "Gummidipoondi",
    "Ponneri (SC)",
    "Tiruttani",
    "Thiruvallur",
    "Poonamallee (SC)",
    "Avadi",
    "Maduravoyal",
    "Tiruvottiyur",
  ],
  Tiruvannamalai: [
    "Tiruvannamalai",
    "Kilpennathur",
    "Kalasapakkam",
    "Polur",
    "Chengam (SC)",
    "Arani",
    "Cheyyar",
    "Vandavasi (SC)",
  ],
  Tiruvarur: ["Tiruvarur", "Nannilam", "Mannargudi", "Thiruthuraipoondi (SC)"],
  Vellore: [
    "Vellore",
    "Katpadi",
    "Anaikattu",
    "Gudiyattam (SC)",
    "Pernambut (SC)",
    "Kilvaithinankuppam (SC)",
  ],
  Viluppuram: ["Villupuram", "Vikravandi", "Gingee", "Mailam", "Tindivanam (SC)", "Vanur (SC)"],
  Virudhunagar: [
    "Virudhunagar",
    "Aruppukkottai",
    "Sattur",
    "Sivakasi",
    "Srivilliputhur (SC)",
    "Rajapalayam",
  ],
};

export interface Donor {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  bloodGroup: BloodGroup;
  available: boolean;
  lastDonation: string;
  city: District;
  constituency: string;
  lifetimeDonations?: number;
}

export interface BloodRequest {
  id: string;
  hospital: string;
  requesterUserId?: string;
  requesterEmail?: string;
  requesterPhone?: string;
  requesterName?: string;
  bloodGroup: BloodGroup;
  units: number;
  urgency: Urgency;
  location: District;
  constituency: string;
  postedMinutesAgo: number;
  status: "Pending" | "Matching" | "Fulfilled";
}

export interface InventoryItem {
  bloodGroup: BloodGroup;
  units: number;
  capacity: number;
  expiry: string;
}

export interface Notification {
  id: string;
  type: "match" | "request" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface DonationHistoryItem {
  donorId: string;
  date: string;
  location: District;
  constituency: string;
  units: number;
  hospitalName?: string;
}

export const donors: Donor[] = [
  {
    id: "D-001",
    name: "Arun Kumar",
    bloodGroup: "O-",
    phone: "+919500320001",
    available: true,
    lastDonation: "2026-01-12",
    city: "Chennai",
    constituency: "Mylapore",
    lifetimeDonations: 3,
  },
  {
    id: "D-002",
    name: "Meena Ravi",
    bloodGroup: "O-",
    phone: "+919500320002",
    available: true,
    lastDonation: "2025-11-04",
    city: "Coimbatore",
    constituency: "Coimbatore South",
    lifetimeDonations: 5,
  },
  {
    id: "D-003",
    name: "Karthik Subramanian",
    bloodGroup: "A+",
    phone: "+919500320003",
    available: false,
    lastDonation: "2026-03-18",
    city: "Madurai",
    constituency: "Madurai Central",
    lifetimeDonations: 4,
  },
  {
    id: "D-004",
    name: "Priya Natarajan",
    bloodGroup: "B+",
    phone: "+919500320004",
    available: true,
    lastDonation: "2025-09-22",
    city: "Salem",
    constituency: "Salem North",
    lifetimeDonations: 7,
  },
  {
    id: "D-005",
    name: "Vignesh Raj",
    bloodGroup: "AB-",
    phone: "+919500320005",
    available: true,
    lastDonation: "2025-10-30",
    city: "Tiruchirappalli",
    constituency: "Tiruchirappalli East",
    lifetimeDonations: 2,
  },
  {
    id: "D-006",
    name: "Saanvi Krishnan",
    bloodGroup: "O+",
    phone: "+919500320006",
    available: true,
    lastDonation: "2026-02-08",
    city: "Tirunelveli",
    constituency: "Palayamkottai",
    lifetimeDonations: 6,
  },
  {
    id: "D-007",
    name: "Dinesh Balan",
    bloodGroup: "A-",
    phone: "+919500320007",
    available: false,
    lastDonation: "2026-04-01",
    city: "Erode",
    constituency: "Erode West",
    lifetimeDonations: 1,
  },
  {
    id: "D-008",
    name: "Nila Senthil",
    bloodGroup: "B-",
    phone: "+919500320008",
    available: true,
    lastDonation: "2025-12-19",
    city: "Vellore",
    constituency: "Vellore",
    lifetimeDonations: 4,
  },
];

export const requests: BloodRequest[] = [
  {
    id: "REQ-8894",
    hospital: "Chennai Government General Hospital",
    requesterPhone: "+919500320101",
    bloodGroup: "O-",
    units: 4,
    urgency: "Critical",
    location: "Chennai",
    constituency: "Mylapore",
    postedMinutesAgo: 8,
    status: "Matching",
  },
  {
    id: "REQ-8891",
    hospital: "Coimbatore Medical College Hospital",
    requesterPhone: "+919500320102",
    bloodGroup: "B-",
    units: 2,
    urgency: "Urgent",
    location: "Coimbatore",
    constituency: "Coimbatore South",
    postedMinutesAgo: 42,
    status: "Matching",
  },
  {
    id: "REQ-8887",
    hospital: "Madurai Rajaji Hospital",
    requesterPhone: "+919500320103",
    bloodGroup: "A+",
    units: 1,
    urgency: "Normal",
    location: "Madurai",
    constituency: "Madurai Central",
    postedMinutesAgo: 120,
    status: "Pending",
  },
  {
    id: "REQ-8880",
    hospital: "Salem Government Mohan Kumaramangalam Medical College Hospital",
    requesterPhone: "+919500320104",
    bloodGroup: "O+",
    units: 6,
    urgency: "Urgent",
    location: "Salem",
    constituency: "Salem North",
    postedMinutesAgo: 180,
    status: "Fulfilled",
  },
  {
    id: "REQ-8875",
    hospital: "Tirunelveli Medical College Hospital",
    requesterPhone: "+919500320105",
    bloodGroup: "AB-",
    units: 1,
    urgency: "Critical",
    location: "Tirunelveli",
    constituency: "Palayamkottai",
    postedMinutesAgo: 14,
    status: "Matching",
  },
];

export const inventory: InventoryItem[] = [
  { bloodGroup: "O-", units: 14, capacity: 120, expiry: "2026-05-12" },
  { bloodGroup: "O+", units: 84, capacity: 120, expiry: "2026-05-22" },
  { bloodGroup: "A-", units: 41, capacity: 100, expiry: "2026-05-18" },
  { bloodGroup: "A+", units: 96, capacity: 120, expiry: "2026-06-02" },
  { bloodGroup: "B-", units: 22, capacity: 80, expiry: "2026-05-15" },
  { bloodGroup: "B+", units: 67, capacity: 100, expiry: "2026-05-29" },
  { bloodGroup: "AB-", units: 8, capacity: 60, expiry: "2026-05-10" },
  { bloodGroup: "AB+", units: 19, capacity: 60, expiry: "2026-06-08" },
];

export const notifications: Notification[] = [];

export const monthlyRequests = [
  { month: "Nov", requests: 142 },
  { month: "Dec", requests: 168 },
  { month: "Jan", requests: 201 },
  { month: "Feb", requests: 187 },
  { month: "Mar", requests: 224 },
  { month: "Apr", requests: 256 },
];

export const bloodDistribution = BLOOD_GROUPS.map((bg, i) => ({
  name: bg,
  value: [320, 880, 210, 640, 180, 420, 90, 140][i],
}));

export const donationHistory: DonationHistoryItem[] = [
  { donorId: "D-001", date: "2026-01-12", location: "Chennai", constituency: "Mylapore", units: 1 },
  {
    donorId: "D-001",
    date: "2025-09-04",
    location: "Kancheepuram",
    constituency: "Kancheepuram",
    units: 1,
  },
  {
    donorId: "D-001",
    date: "2025-05-18",
    location: "Chengalpattu",
    constituency: "Chengalpattu",
    units: 2,
  },
];
