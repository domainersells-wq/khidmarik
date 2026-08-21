
import type { Listing, Category, Review, Store, Professional, VerifiedBadge, ProductItem, GroupOrderItem, PartCategory, PartRequest, ListedPart, PartCondition, DigitalServiceCategory, FreelancerProfile, PortfolioItem, ServicePackage, ProductVariantOption, ProductVariant, ProductVariantAttribute, AlgerianWilaya, UserProfileData, AppointmentConfig, Appointment, AlgerianMunicipality, ActivityLogItem, TopSellingProductItem, NotificationItem, ProfessionalVerificationQueueItem, ProfessionalActivityStatus, ListingApprovalQueueItem, ServiceCategoryDemand, UserSearchQuery, SupportTicketSummary, TopContentItem, AdminVerificationRequestItem, PlatformStore, PlatformServiceProvider, UserRole, PlatformUser, PlatformFinancialKPI, StoreSubscriptionPlan } from '@/types';
import { Utensils, Laptop, Shirt, Wrench, Zap, Palette, ShoppingCart, Hammer, Stethoscope, Briefcase as BriefcaseIcon, ShieldCheck, Award, MessageSquare, Lightbulb, AirVent, HardDrive, CarFront, Refrigerator, PaintRoller, Cog, PackageSearch, Code, Brush, BarChart3, BookOpen, Video, SearchCode, Users, Home, BookMarked, HeartPulse, Leaf, Tent, Car, GraduationCap, Landmark, PawPrint, Plane, Anchor, Building, Drama, Film, ToyBrick, Dumbbell, SprayCan, Truck as TruckIcon, Ticket, PlusCircle, LayoutDashboard, BarChartHorizontalBig, DollarSign as DollarSignIcon, Activity, Package, Eye, Megaphone, ImageIcon, List, Filter, MoreHorizontal, Printer, FileText, CheckCircle as CheckCircleIcon, XCircle, Hourglass, CalendarDays, AlertTriangle, Store as StoreIcon, UserCheck, ClipboardList, UserMinus, FileWarning, LineChart, PieChart, Map as MapIcon, Table as TableIcon, BadgeDollarSign, TrendingUp, UserPlus, MessageSquareWarning } from 'lucide-react';
import { algerianWilayas as fullAlgerianWilayasData } from './algerian-wilayas'; 

export const categories: Category[] = [
  { id: 'cat1', name: 'Restaurants', slug: 'restaurants', icon: Utensils, type: 'store' },
  { id: 'cat2', name: 'Electronics', slug: 'electronics', icon: Laptop, type: 'store' },
  { id: 'cat3', name: 'Clothing', slug: 'clothing', icon: Shirt, type: 'store' },
  { id: 'cat4', name: 'Groceries', slug: 'groceries', icon: ShoppingCart, type: 'store' },
  { id: 'cat5', name: 'Plumbers', slug: 'plumbers', icon: Wrench, type: 'professional' },
  { id: 'cat6', name: 'Electricians', slug: 'electricians', icon: Zap, type: 'professional' },
  { id: 'cat7', name: 'Painters', slug: 'painters', icon: PaintRoller, type: 'professional' },
  { id: 'cat8', name: 'Handyman', slug: 'handyman', icon: Hammer, type: 'professional' },
  { id: 'cat9', name: 'Doctors', slug: 'doctors', icon: Stethoscope, type: 'professional' },
  { id: 'cat10', name: 'Consultants', slug: 'consultants', icon: BriefcaseIcon, type: 'professional' },
  { id: 'cat11', name: 'Home Goods', slug: 'home-goods', icon: Lightbulb, type: 'store' },
  { id: 'cat12', name: 'HVAC Services', slug: 'hvac-services', icon: AirVent, type: 'professional'},
  { id: 'cat13', name: 'Furniture', slug: 'furniture', icon: Home, type: 'store'},
  { id: 'cat14', name: 'Books & Stationery', slug: 'books-stationery', icon: BookMarked, type: 'store' },
  { id: 'cat15', name: 'Beauty & Personal Care', slug: 'beauty-personal-care', icon: HeartPulse, type: 'store' },
  { id: 'cat16', name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: Tent, type: 'store' },
  { id: 'cat17', name: 'Automotive Services', slug: 'automotive-services', icon: Car, type: 'professional' },
  { id: 'cat18', name: 'Legal Services', slug: 'legal-services', icon: Landmark, type: 'professional' },
  { id: 'cat19', name: 'Educational Tutors', slug: 'educational-tutors', icon: GraduationCap, type: 'professional' },
  { id: 'cat20', name: 'Pet Services', slug: 'pet-services', icon: PawPrint, type: 'professional' },
  { id: 'cat21', name: 'Travel Agencies', slug: 'travel-agencies', icon: Plane, type: 'store' },
  { id: 'cat22', name: 'Real Estate Agents', slug: 'real-estate-agents', icon: Building, type: 'professional' },
  { id: 'cat23', name: 'Event Planning', slug: 'event-planning', icon: Drama, type: 'professional' },
  { id: 'cat24', name: 'Photography Services', slug: 'photography-services', icon: Film, type: 'professional' },
  { id: 'cat25', name: 'Pharmacies', slug: 'pharmacies', icon: HeartPulse, type: 'store' },
  { id: 'cat26', name: 'Toys & Games', slug: 'toys-games', icon: ToyBrick, type: 'store' },
  { id: 'cat27', name: 'Fitness Trainers', slug: 'fitness-trainers', icon: Dumbbell, type: 'professional' },
  { id: 'cat28', name: 'Cleaning Services', slug: 'cleaning-services', icon: SprayCan, type: 'professional' },
  { id: 'cat29', name: 'Movers', slug: 'movers', icon: TruckIcon, type: 'professional' },
  { id: 'cat30', name: 'AI Consulting', slug: 'ai-consulting', icon: Zap, type: 'professional' }, // Added for dashboard
  { id: 'cat31', name: 'Data Science', slug: 'data-science', icon: SearchCode, type: 'professional' }, // Added for dashboard
  { id: 'cat99', name: 'Other', slug: 'other', icon: Anchor, type: 'all' },
];

export const digitalServiceCategories: DigitalServiceCategory[] = [
  { id: 'dsc1', name: 'Graphic Design', slug: 'graphic-design', icon: Brush, description: 'Logos, branding, illustrations, and more.' },
  { id: 'dsc2', name: 'Web Development', slug: 'web-development', icon: Code, description: 'Custom websites, e-commerce solutions, web apps.' },
  { id: 'dsc3', name: 'Digital Marketing', slug: 'digital-marketing', icon: BarChart3, description: 'SEO, social media, content marketing, ads.' },
  { id: 'dsc4', name: 'Writing & Translation', slug: 'writing-translation', icon: BookOpen, description: 'Articles, copywriting, translation services.' },
  { id: 'dsc5', name: 'Video & Animation', slug: 'video-animation', icon: Video, description: 'Video editing, motion graphics, explainer videos.' },
  { id: 'dsc6', name: 'AI Services', slug: 'ai-services', icon: Zap, description: 'Prompt engineering, AI model integration, automation.' },
  { id: 'dsc7', name: 'Data Analysis', slug: 'data-analysis', icon: SearchCode, description: 'Data processing, visualization, and reporting.' },
  { id: 'dsc8', name: 'Virtual Assistant', slug: 'virtual-assistant', icon: Users, description: 'Administrative, technical, or creative assistance remotely.' },
  { id: 'dsc9', name: 'Music & Audio', slug: 'music-audio', icon: Palette , description: 'Voice overs, jingles, podcast editing.' },
  { id: 'dsc10', name: 'Business Consulting', slug: 'business-consulting', icon: BriefcaseIcon, description: 'Strategy, finance, HR, and operations advice.' },
];

export const partCategories: PartCategory[] = [
  { id: 'pc1', name: 'Appliance Parts', slug: 'appliance-parts', icon: Refrigerator, description: 'Parts for washing machines, fridges, ovens, etc.' },
  { id: 'pc2', name: 'Electronics Components', slug: 'electronics-components', icon: HardDrive, description: 'Resistors, capacitors, ICs, computer parts, etc.' },
  { id: 'pc3', name: 'Automotive Parts', slug: 'automotive-parts', icon: CarFront, description: 'Parts for cars, motorcycles, and other vehicles.' },
  { id: 'pc4', name: 'General Hardware & DIY', slug: 'general-hardware-diy', icon: PaintRoller, description: 'Screws, brackets, fittings, and various DIY supplies.' },
  { id: 'pc5', name: 'Phone & Tablet Parts', slug: 'phone-tablet-parts', icon: Laptop, description: 'Screens, batteries, and other components for mobile devices.' },
  { id: 'pc6', name: 'Tools & Equipment', slug: 'tools-equipment', icon: Wrench, description: 'Hand tools, power tools, and workshop equipment.'},
  { id: 'pc7', name: 'Devices for Parting Out', slug: 'devices-for-parting-out', icon: PackageSearch, description: 'Non-working or old devices sold for their components.'},
  { id: 'pc8', name: 'Industrial Machinery Parts', slug: 'industrial-machinery', icon: Cog, description: 'Parts for heavy machinery and industrial equipment.' },
  { id: 'pc9', name: 'Agricultural Equipment Parts', slug: 'agricultural-equipment', icon: Leaf, description: 'Components for tractors, plows, and farming tools.' },
  { id: 'pc10', name: 'Computer Peripherals & Accessories', slug: 'computer-accessories', icon: Laptop, description: 'Keyboards, mice, monitors, cables etc.' },
  { id: 'pc11', name: 'Plumbing & Fixtures', slug: 'plumbing-fixtures', icon: Wrench, description: 'Pipes, faucets, valves, and bathroom/kitchen fixtures.' },
  { id: 'pc99', name: 'Other Parts', slug: 'other-parts', icon: Cog, description: 'Miscellaneous parts not fitting other categories.' },
];

export const algerianWilayas: AlgerianWilaya[] = fullAlgerianWilayasData; 


const sampleReviews: Review[] = [
  { id: 'rev1', author: 'Jane Doe', rating: 5, comment: 'Excellent service and friendly staff!', date: new Date(2023, 5, 15).toISOString(), detailedRatings: { timeliness: 5, qualityOfWork: 5, cleanliness: 5} },
  { id: 'rev2', author: 'John Smith', rating: 4, comment: 'Good value for money, would recommend.', date: new Date(2023, 6, 2).toISOString(), detailedRatings: { timeliness: 4, qualityOfWork: 4 } },
  { id: 'rev3', author: 'Alice Brown', rating: 3, comment: 'Average experience, could be better.', date: new Date(2023, 4, 10).toISOString(), detailedRatings: { timeliness: 3, qualityOfWork: 3, cleanliness: 4 } },
];

const professionalReviews: Review[] = [
   { id: 'prev1', author: 'Mike P.', rating: 5, comment: 'Very professional and fixed the issue quickly!', date: new Date(2023, 7, 1).toISOString(), detailedRatings: { timeliness: 5, qualityOfWork: 5, cleanliness: 5} },
   { id: 'prev2', author: 'Sarah K.', rating: 4, comment: 'Knowledgeable and efficient. Fair pricing.', date: new Date(2023, 7, 5).toISOString(), detailedRatings: { timeliness: 4, qualityOfWork: 5, cleanliness: 4 } },
];

const freelancerReviews: Review[] = [
  { id: 'frev1', author: 'Business Owner A', rating: 5, comment: 'Delivered amazing designs ahead of schedule!', date: new Date(2023, 8, 10).toISOString() },
  { id: 'frev2', author: 'Startup X', rating: 4.5, comment: 'Great communication and quality work for our website.', date: new Date(2023, 9, 22).toISOString() },
];

const defaultVerifiedBadges: VerifiedBadge[] = [
  { name: "ID Verified", icon: ShieldCheck, description: "Identity has been verified by Khidmatik." },
  { name: "Responsive", icon: MessageSquare, description: "Known for quick replies to inquiries."}
];

const sampleTshirtVariantOptions: ProductVariantOption[] = [
    { name: 'Color', values: ['Red', 'Blue', 'Black', 'Green'] },
    { name: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] },
];
const sampleTshirtVariants: ProductVariant[] = [
    { id: 'ts1-red-s', attributes: [{name: 'Color', value: 'Red'}, {name: 'Size', value: 'S'}], price: 1500, stock: 10, image: 'https://placehold.co/300x300/FF0000/FFFFFF.png?text=Red+S' },
    { id: 'ts1-red-m', attributes: [{name: 'Color', value: 'Red'}, {name: 'Size', value: 'M'}], price: 1500, stock: 15, image: 'https://placehold.co/300x300/FF0000/FFFFFF.png?text=Red+M' },
    { id: 'ts1-red-l', attributes: [{name: 'Color', value: 'Red'}, {name: 'Size', value: 'L'}], price: 1500, stock: 0, image: 'https://placehold.co/300x300/FF0000/FFFFFF.png?text=Red+L' },
    { id: 'ts1-blue-m', attributes: [{name: 'Color', value: 'Blue'}, {name: 'Size', value: 'M'}], price: 1600, stock: 12, image: 'https://placehold.co/300x300/0000FF/FFFFFF.png?text=Blue+M' },
    { id: 'ts1-blue-l', attributes: [{name: 'Color', value: 'Blue'}, {name: 'Size', value: 'L'}], price: 1600, stock: 5, image: 'https://placehold.co/300x300/0000FF/FFFFFF.png?text=Blue+L' },
    { id: 'ts1-black-xl', attributes: [{name: 'Color', value: 'Black'}, {name: 'Size', value: 'XL'}], price: 1600, stock: 8, image: 'https://placehold.co/300x300/000000/FFFFFF.png?text=Black+XL' },
    { id: 'ts1-green-m', attributes: [{name: 'Color', value: 'Green'}, {name: 'Size', value: 'M'}], price: 1550, stock: 20, image: 'https://placehold.co/300x300/008000/FFFFFF.png?text=Green+M' },
];


const sampleStoreProducts: ProductItem[] = [
    { id: 'prod1', slug: 'modern-led-chandelier', name: 'Modern LED Chandelier', baseImageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'modern chandelier', requiresInstallation: true, installationServiceCategory: 'electricians', installationTaskName: 'Chandelier Installation', variants: [{ id: 'chand-1', attributes: [], price: 12500, stock: 10 }], expiryDate: '2025-12-31' },
    { id: 'prod2', slug: 'smart-thermostat', name: 'Smart Thermostat', baseImageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'smart thermostat', requiresInstallation: true, installationServiceCategory: 'electricians', installationTaskName: 'Smart Thermostat Setup', variants: [{ id: 'therm-1', attributes: [], price: 8500, stock: 5 }] },
    { id: 'prod3', slug: 'bookshelf-assembly-kit', name: 'Bookshelf Assembly Kit', baseImageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'bookshelf', requiresInstallation: true, installationServiceCategory: 'handyman', installationTaskName: 'Bookshelf Assembly', isMadeInAlgeria: true, variants: [{ id: 'booksh-1', attributes: [], price: 5000, stock: 15 }] },
    { id: 'prod4', slug: 'decorative-vase-set', name: 'Decorative Vase Set', baseImageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'decorative vase', isMadeInAlgeria: true, variants: [{ id: 'vase-1', attributes: [], price: 3000, stock: 20 }] },
    {
        id: 'prod-tshirt1',
        slug: 'khidmatik-tshirt',
        name: 'Khidmatik Supporter T-Shirt',
        baseImageUrl: 'https://placehold.co/300x300/CCCCCC/FFFFFF.png?text=Khidmatik+Tee',
        dataAiHint: 'logo t-shirt',
        isMadeInAlgeria: true,
        variantOptions: sampleTshirtVariantOptions,
        variants: sampleTshirtVariants,
    }
];

const sampleGroupOrderItems: GroupOrderItem[] = [
  {
    id: 'go1',
    storeId: 'store4', 
    name: 'Bulk Organic Olive Oil (5L)',
    description: 'Premium extra virgin olive oil, perfect for stocking up. Get a better price by buying together!',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'olive oil bottle',
    basePrice: 7000, 
    priceTiers: [
      { minBuyers: 5, price: 6500 },
      { minBuyers: 10, price: 6000 },
      { minBuyers: 20, price: 5500 },
    ],
    currentBuyers: 7,
    shareUrl: '/listings/store4?groupOrder=go1'
  },
];

const sampleAppointments: Appointment[] = [
  {
    reservationId: 'APT-FAT-3018',
    professionalId: 'prof2',
    professionalName: 'Dr. Fatima Zohra',
    professionalCategory: 'Doctors',
    clinicLogoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=DrFZ&backgroundColor=E0E0E0',
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), 
    timeSlot: '10:00 AM - 10:30 AM',
    patientName: 'Amine User',
    reasonForVisit: 'Follow-up check',
    status: 'confirmed',
    notes: 'Please bring previous medical records if any.'
  },
  {
    reservationId: 'APT-PLM-9275',
    professionalId: 'prof1',
    professionalName: 'Rapid Rooter Plumbing Algérie',
    professionalCategory: 'Plumbers',
    date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), 
    patientName: 'Amine User', 
    reasonForVisit: 'Leaky faucet in kitchen',
    status: 'completed',
  }
];


export const mockUserProfile: UserProfileData = {
  id: "user123_ac_user_new_shop_owner",
  name: "Amine User",
  email: "amine.user@example.dz",
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=AmineUser",
  memberSince: "March 10, 2024",
  isVerified: true,
  walletBalance: 1250.75,
  ongoingServices: [
    {
      id: 'service_ac_check',
      serviceName: 'Annual AC Maintenance',
      providerName: 'Cool Air Solutions Algérie',
      amountInEscrow: 6000.00,
      dateBooked: '2024-06-09T12:00:00.000Z',
    }
  ],
  loyaltyPoints: 2300,
  isStoreOwner: true, // Ensures Store Owner access
  storeId: 'store3', // Links to "Artisans d'Algérie"
  isFreelancer: true,
  subscriptionPlan: 'basic',
  linkedAccounts: [
    { platform: 'Google', identifier: 'amine.user@gmail.com', isLinked: true, icon: Laptop },
    { platform: 'Phone', identifier: '+213 661234567', isLinked: true, icon: Zap },
  ],
  topUpHistory: [
      { id: 'tu_amine1', userId: 'user123_ac_user_new_shop_owner', amount: 5000, method: 'ccp', status: 'approved', transactionCode: 'REF-KH-CCP001', createdAt: '2024-06-10T12:00:00.000Z', processedAt: '2024-06-11T10:00:00.000Z' },
      { id: 'tu_amine2', userId: 'user123_ac_user_new_shop_owner', amount: 10000, method: 'bank', status: 'pending-review', transactionCode: 'REF-KH-BNK002', createdAt: '2024-06-12T14:00:00.000Z' },
  ],
  digitalProjects: [{id: 'proj1', name: 'Logo for Cafe Y', status: 'Completed'}],
  appointments: sampleAppointments, 
};


export const mockListings: Listing[] = [
  {
    id: 'store1',
    name: 'The Gourmet Place Algérie',
    type: 'store',
    category: 'Restaurants',
    description: 'A cozy restaurant offering the best Algerian and Mediterranean cuisine in Algiers. Perfect for family dinners and romantic evenings.',
    images: ['https://placehold.co/800x450.png', 'https://placehold.co/600x400.png'],
    bannerImageUrl: 'https://placehold.co/1200x300.png?text=Gourmet+Place+Banner',
    storeLogoUrl: 'https://placehold.co/100x100.png?text=GP',
    dataAiHint: 'restaurant food',
    contact: { phone: '021-123-456', email: 'info@gourmetplace-alger.dz', website: 'https://gourmetplace-alger.dz' },
    location: { city: 'Alger Centre', fullAddress: '123 Rue Didouche Mourad, Alger Centre', zipCode: '16000', wilayaCode: '16' },
    reviews: sampleReviews,
    averageRating: 4.2,
    pricing: '$$',
    popularity: 150,
    operatingHours: 'Sam-Jeu: 11h - 22h, Ven: 12h - 20h',
    products: [
        {id: 'pizza1', slug: 'pizza-royale', name: 'Pizza Royale', baseImageUrl: 'https://placehold.co/300x200.png?text=Pizza', dataAiHint: 'pizza', variants: [{id:'pizvar1', attributes:[], price: 1500, stock: 50}] },
        {id: 'pasta1', slug: 'couscous-royal', name: 'Couscous Royal', baseImageUrl: 'https://placehold.co/300x200.png?text=Couscous', dataAiHint: 'couscous dish', variants: [{id:'pastvar1', attributes:[], price: 1800, stock: 30}] }
    ],
    subscriptionPlan: 'pro',
  } as Store,
  {
    id: 'store2',
    name: 'Tech Universe Algérie',
    type: 'store',
    category: 'Electronics',
    description: 'Your one-stop shop for the latest gadgets, computers, and accessories in Algérie.',
    images: ['https://placehold.co/800x450.png', 'https://placehold.co/600x400.png'],
    bannerImageUrl: 'https://placehold.co/1200x300.png?text=Tech+Universe+Deals',
    storeLogoUrl: 'https://placehold.co/100x100.png?text=TU',
    dataAiHint: 'electronics shop',
    contact: { phone: '031-987-654', email: 'sales@techuniverse.dz', website: 'https://techuniverse.dz' },
    location: { city: 'Oran', fullAddress: '456 Avenue de la Technologie, Oran', zipCode: '31000', wilayaCode: '31' },
    reviews: sampleReviews.slice(0,2),
    averageRating: 4.5,
    pricing: '$$$',
    popularity: 250,
    operatingHours: 'Dim-Jeu: 10h - 20h',
    products: [
        {id: 'laptop1', slug: 'laptop-pro-x', name: 'Laptop Pro X', baseImageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'laptop computer', variants: [{id: 'lapvar1', attributes:[], price: 120000, stock: 10}]},
        {id: 'phone1', slug: 'smartphone-z', name: 'Smartphone Z', baseImageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'smartphone', variants: [{id:'phvar1', attributes:[], price: 80000, stock: 25}]},
        {id: 'ac1', slug: 'split-ac-12000btu', name: 'Split AC Unit 12000 BTU', baseImageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'air conditioner', requiresInstallation: true, installationServiceCategory: 'hvac-services', installationTaskName: 'AC Unit Installation', variants: [{id:'acvar1', attributes:[], price: 65000, stock: 7}]}
    ],
    subscriptionPlan: 'pro',
  } as Store,
  {
    id: 'store3',
    name: 'Artisans d\'Algérie',
    type: 'store',
    category: 'Home Goods',
    description: 'Discover unique handmade crafts and artisanal products from local creators in Algérie.',
    images: ['https://placehold.co/800x450.png'],
    bannerImageUrl: 'https://placehold.co/1200x300.png?text=Artisans+d\'Algérie',
    storeLogoUrl: 'https://placehold.co/100x100.png?text=AA',
    dataAiHint: 'handmade crafts',
    contact: { phone: '045-555-012', email: 'contact@artisansalgerie.dz' },
    location: { city: 'Sidi Bel Abbès', fullAddress: '789 Rue de l\'Artisanat, Sidi Bel Abbès', zipCode: '22000', wilayaCode: '22' },
    reviews: [sampleReviews[1]],
    averageRating: 4.8,
    pricing: '$$',
    popularity: 90,
    operatingHours: 'Mar-Dim: 10h - 18h',
    isMadeInAlgeria: true,
    products: [
        { id: 'artprod1', slug: 'berber-rug', name: 'Handwoven Berber Rug', baseImageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'berber rug', isMadeInAlgeria: true, variants: [{id:'rugvar1', attributes:[], price: 18000, stock: 3}]},
        { id: 'artprod2', slug: 'pottery-set', name: 'Artisanal Pottery Set', baseImageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'pottery set', isMadeInAlgeria: true, variants: [{id:'potvar1', attributes:[], price: 7500, stock: 8}]},
        sampleStoreProducts[4], 
    ],
    subscriptionPlan: 'basic',
  } as Store,
  {
    id: 'prof1',
    name: 'Rapid Rooter Plumbing Algérie',
    type: 'professional',
    category: 'Plumbers',
    description: 'Reliable and affordable plumbing services across Algérie. 24/7 emergency calls available. Licensed and insured.',
    images: ['https://placehold.co/800x450.png'],
    dataAiHint: 'plumbing tools',
    contact: { phone: '0550-123-456', email: 'service@rapidrooteralgerie.dz' },
    location: { city: 'Constantine', fullAddress: '101 Avenue des Plombiers, Constantine', zipCode: '25000', wilayaCode: '25' },
    reviews: professionalReviews,
    averageRating: 4.8,
    pricing: '$$', 
    servicePrice: 7500, 
    standardInstallationPrice: 8000, 
    popularity: 120,
    servicesOffered: ['Leak Repair', 'Drain Cleaning', 'Water Heater Installation', 'Fixture Installation'],
    qualifications: ['Licensed Plumber #ALG123', 'Master Plumber Certified', 'Gas Safety Certified'],
    verifiedBadges: [
      ...defaultVerifiedBadges,
      { name: "Skills Certified", icon: Award, description: "Plumbing certifications verified." }
    ],
    supportsAppointments: false, 
  } as Professional,
  {
    id: 'prof2',
    name: 'Dr. Fatima Zohra - General Practitioner',
    type: 'professional',
    category: 'Doctors',
    description: 'Experienced general practitioner providing comprehensive healthcare for all ages. Located in central Sidi Bel Abbès.',
    images: ['https://placehold.co/800x450.png?text=Doctor+Office'],
    clinicLogoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=DrFZ&backgroundColor=E0E0E0',
    dataAiHint: 'doctor clinic',
    contact: { phone: '048-777-888', email: 'dr.fatima@clinic.dz' },
    location: { city: 'Sidi Bel Abbès', fullAddress: 'Clinique El Hayet, Rue de la Paix', zipCode: '22000', wilayaCode: '22' },
    reviews: [...sampleReviews, ...professionalReviews].slice(0,3),
    averageRating: 4.9,
    pricing: '$$', 
    servicePrice: 2000, 
    popularity: 300,
    servicesOffered: ['General Check-ups', 'Vaccinations', 'Minor Illness Treatment', 'Health Advice'],
    qualifications: ['MD - University of Algiers', 'Board Certified GP'],
    verifiedBadges: defaultVerifiedBadges,
    supportsAppointments: true,
    appointmentConfig: { dailyCapacity: 15, leadTimeDays: 1 }
  } as Professional,
   {
    id: 'freelancer1',
    type: 'freelancer',
    name: 'Creative Pixel Studio',
    tagline: 'Crafting Digital Experiences that Inspire.',
    digitalCategorySlug: 'graphic-design',
    category: 'Graphic Design', 
    description: 'Experienced graphic designer specializing in branding, logo design, and web visuals. Passionate about helping businesses in Algérie create a strong visual identity. Let\'s collaborate on your next project!',
    images: ['https://placehold.co/800x450.png?text=Portfolio+Highlight'],
    contact: { email: 'hello@creativepixel.dz', website: 'https://creativepixel.dz' },
    location: { city: 'Alger', fullAddress: 'Remote / Alger', zipCode: '16000', wilayaCode: '16' },
    reviews: freelancerReviews,
    averageRating: 4.9,
    pricing: '$$$',
    skills: ['Logo Design', 'Branding', 'UI/UX Design', 'Adobe Creative Suite', 'Figma', 'Illustration'],
    portfolio: [
      { id: 'p1', title: 'Logo for "Algérie Cafe"', description: 'Modern and inviting logo design.', imageUrl: 'https://placehold.co/400x300.png?text=Algérie+Cafe+Logo', dataAiHint: 'cafe logo' },
      { id: 'p2', title: 'Web Design for "Sahara Tours"', description: 'User-friendly website mockups.', imageUrl: 'https://placehold.co/400x300.png?text=Sahara+Tours+Web', dataAiHint: 'website design' },
    ],
    servicePackages: [
      { id: 'sp1', name: 'Logo Design Basic', description: '3 logo concepts, 2 revisions.', price: 15000, deliverables: ['High-res logo files (PNG, SVG)', 'Color palette'] },
      { id: 'sp2', name: 'Branding Starter Kit', description: 'Logo, business card, social media profile graphics.', price: 35000, deliverables: ['All Basic deliverables', 'Business card design', 'Social media graphics'] },
    ],
    operatingHours: 'Lun-Ven: 9h - 17h (Flexible pour projets)',
  } as FreelancerProfile,
  {
    id: 'freelancer2',
    type: 'freelancer',
    name: 'Algérie Web Wizards',
    tagline: 'Building Fast & Reliable Websites for Local Businesses.',
    digitalCategorySlug: 'web-development',
    category: 'Web Development', 
    description: 'Full-stack web developer based in Algérie, creating custom websites and e-commerce platforms. Proficient in modern technologies to bring your online presence to life.',
    images: ['https://placehold.co/800x450.png?text=Web+Dev+Code'],
    contact: { email: 'contact@algeriewebwizards.dz', phone: '0551-987-654' },
    location: { city: 'Oran', fullAddress: 'Travaille à distance', zipCode: '31000', wilayaCode: '31' },
    reviews: freelancerReviews.slice(0,1),
    averageRating: 4.7,
    pricing: '$$$',
    skills: ['React', 'Next.js', 'Node.js', 'E-commerce', 'Database Management', 'API Integration'],
    portfolio: [
      { id: 'pweb1', title: 'E-commerce Site for "Artisan Crafts Algérie"', description: 'Fully functional online store.', imageUrl: 'https://placehold.co/400x300.png?text=Crafts+Ecomm+DZ', dataAiHint: 'ecommerce website' },
    ],
    servicePackages: [
      { id: 'spweb1', name: 'Landing Page Development', description: 'Single-page responsive website.', price: 25000, deliverables: ['Deployed landing page', 'Basic SEO setup'] },
      { id: 'spweb2', name: 'Full E-commerce Setup', description: 'Multi-page store with payment integration.', price: 80000, deliverables: ['Full e-commerce site', 'Admin panel training', 'Payment gateway setup'] },
    ],
  } as FreelancerProfile,
   {
    id: 'store4',
    name: 'Fresh Foods Market Algérie',
    type: 'store',
    category: 'Groceries',
    description: 'High-quality organic produce, meats, and pantry staples. Supporting local farmers in Algérie.',
    images: ['https://placehold.co/800x450.png', 'https://placehold.co/600x400.png'],
    bannerImageUrl: 'https://placehold.co/1200x300.png?text=Fresh+Foods+Algérie',
    storeLogoUrl: 'https://placehold.co/100x100.png?text=FFA',
    dataAiHint: 'grocery store',
    contact: { phone: '045-111-222', email: 'manager@freshfoodsalgerie.dz', website: 'https://freshfoodsalgerie.dz' },
    location: { city: 'Sidi Bel Abbès', fullAddress: '303 Avenue des Fermiers, Sidi Bel Abbès', zipCode: '22003', wilayaCode: '22' },
    reviews: [sampleReviews[0], sampleReviews[2]],
    averageRating: 3.8,
    pricing: '$$',
    popularity: 180,
    operatingHours: 'Dim-Jeu: 8h - 21h',
    products: [
        {id: 'apple1', slug:'organic-apples', name: 'Organic Apples', baseImageUrl: 'https://placehold.co/300x200.png?text=Apples', dataAiHint: 'apples', variants: [{id:'appvar1', attributes:[], price: 300, stock: 100}]},
        {id: 'bread1', slug:'artisan-bread', name: 'Artisan Bread', baseImageUrl: 'https://placehold.co/300x200.png?text=Bread', dataAiHint: 'bread', isMadeInAlgeria: true, variants: [{id:'brdvar1', attributes:[], price: 500, stock: 40}]}
    ],
    groupOrderItems: sampleGroupOrderItems,
    isMadeInAlgeria: true,
    subscriptionPlan: 'basic',
  } as Store,
];

export const mockPartRequests: PartRequest[] = [
  {
    id: 'req1',
    userId: 'user123',
    partName: 'Washing Machine Pump LX-500',
    partDescription: 'Need a replacement pump for a Brandt front-loader, model WM1000. Old one is leaking.',
    categorySlug: 'appliance-parts',
    deviceModel: 'Brandt WM1000',
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
    urgency: 'medium',
    imageUrls: ['https://placehold.co/300x200.png?text=Pump+Request'],
  },
];
export const mockListedParts: ListedPart[] = [
  {
    id: 'lp1',
    userId: 'sellerABC',
    partName: 'Used iPhone 8 Screen Assembly (Working)',
    originalDeviceName: 'iPhone 8',
    description: 'Original Apple screen assembly, pulled from a working iPhone 8. Minor scratches but fully functional. Includes digitizer.',
    categorySlug: 'phone-tablet-parts',
    price: 3500,
    condition: 'used-good',
    imageUrls: ['https://placehold.co/300x200.png?text=iPhone+8+Screen'],
    location: { city: 'Alger', wilayaCode: '16' },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
    isSold: false,
  },
  {
    id: 'lp2',
    userId: 'sellerXYZ',
    partName: 'Renault Clio IV Headlight (Right)',
    originalDeviceName: 'Renault Clio IV (2013-2019)',
    description: 'Used original headlight, good condition, no cracks, all mounting points intact. Halogen type.',
    categorySlug: 'automotive-parts',
    price: 7000,
    condition: 'used-working',
    imageUrls: ['https://placehold.co/300x200.png?text=Clio+Headlight'],
    location: { city: 'Oran', wilayaCode: '31' },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
    isSold: false,
  },
];

export const getListingById = (id: string): Listing | undefined => {
  return mockListings.find(listing => listing.id === id);
};

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return categories.find(category => category.slug === slug);
};

export const getDigitalServiceCategoryBySlug = (slug: string): DigitalServiceCategory | undefined => {
  return digitalServiceCategories.find(category => category.slug === slug);
};

export const getPartCategoryBySlug = (slug: string): PartCategory | undefined => {
  return partCategories.find(category => category.slug === slug);
};

export const getWilayaByCode = (code: string): AlgerianWilaya | undefined => {
    return algerianWilayas.find(w => w.code === code);
};

// Mock data for Store Dashboard Overview
export const mockSalesData: { name: string; sales: number }[] = [
  { name: 'Mon', sales: 40000 },
  { name: 'Tue', sales: 30000 },
  { name: 'Wed', sales: 20000 },
  { name: 'Thu', sales: 27800 },
  { name: 'Fri', sales: 18900 },
  { name: 'Sat', sales: 23900 },
  { name: 'Sun', sales: 34900 },
];

export const mockActivityLog: ActivityLogItem[] = [
  { id: 'act1', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'new_order', description: 'New order #ORD1024 received from Amine B.' },
  { id: 'act2', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), type: 'customer_registration', description: 'Customer "Fatima Z." registered.' },
  { id: 'act3', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'product_review', description: 'Product "Artisan Pottery Set" received a 5-star review.'},
];

export const mockTopProducts: TopSellingProductItem[] = [
  { id: 'topprod1', name: 'Handwoven Berber Rug', salesCount: 50, revenue: 900000, imageUrl: 'https://placehold.co/40x40.png?text=Rug' },
  { id: 'topprod2', name: 'Organic Olive Oil (5L)', salesCount: 35, revenue: 210000, imageUrl: 'https://placehold.co/40x40.png?text=Oil' },
  { id: 'topprod3', name: 'Khidmatik Supporter T-Shirt (Red, M)', salesCount: 25, revenue: 37500, imageUrl: 'https://placehold.co/40x40.png?text=Tee' },
];


// Updated mockProducts for Store Dashboard ProductsSection
export const mockDashboardProducts: ProductItem[] = [
  { id: 'dashprod101', slug:'artisan-ceramic-mug', name: 'Artisan Ceramic Mug', baseImageUrl: 'https://placehold.co/50x50.png?text=Mug', variants: [{id: 'mug-std', attributes:[], price: 1200, stock: 25}], expiryDate: '2025-12-31' },
  { id: 'dashprod102', slug:'handmade-leather-wallet', name: 'Handmade Leather Wallet', baseImageUrl: 'https://placehold.co/50x50.png?text=Wallet', variants: [{id: 'wallet-std', attributes:[], price: 3500, stock: 8}], isMadeInAlgeria: true },
  { id: 'dashprod103', slug:'spicy-harissa-paste', name: 'Spicy Harissa Paste', baseImageUrl: 'https://placehold.co/50x50.png?text=Harissa', variants: [{id: 'harissa-std', attributes:[], price: 800, stock: 0}], expiryDate: '2024-09-30' },
  {
    id: 'dashprod-tshirt1',
    slug: 'khidmatik-fashion-tshirt',
    name: 'Khidmatik Fashion T-Shirt',
    baseImageUrl: 'https://placehold.co/50x50/CCCCCC/FFFFFF.png?text=KhidmatikTee',
    dataAiHint: 'fashion t-shirt',
    isMadeInAlgeria: true,
    variantOptions: sampleTshirtVariantOptions, // Reusing from above for consistency
    variants: sampleTshirtVariants, // Reusing from above for consistency
    expiryDate: undefined // Clothing typically doesn't expire
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif1',
    type: 'reservation',
    title: 'Appointment Confirmed: Dr. Fatima Zohra',
    message: 'Your appointment for tomorrow at 10:00 AM is confirmed. Ref ID: APT-DRF-12345.',
    timestamp: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    icon: CalendarDays,
    isRead: false,
  },
  {
    id: 'notif2',
    type: 'purchase',
    title: 'Order Shipped: #ORD-XYZ-789',
    message: 'Your order for "Modern LED Chandelier" has been shipped and is on its way!',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    icon: ShoppingCart,
    isRead: false,
  },
  {
    id: 'notif3',
    type: 'alert',
    title: 'Low Stock Alert: Artisan Bread',
    message: 'Your product "Artisan Bread" has only 5 units left in stock.',
    timestamp: new Date().toISOString(),
    icon: AlertTriangle,
    isRead: true,
  },
];

// Mock data for Professional Services Dashboard
export const mockProfessionalVerificationQueue: ProfessionalVerificationQueueItem[] = [
  { id: 'vet1', professionalName: 'Amina K.', professionCategory: 'AI Consulting', applicationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'Pending Verification', assignedTo: 'Ali B.' },
  { id: 'vet2', professionalName: 'Youssef B.', professionCategory: 'Graphic Design', applicationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'Needs More Info', assignedTo: 'Fatima C.' },
  { id: 'vet3', professionalName: 'Lila M.', professionCategory: 'Data Science', applicationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'Pending Verification', assignedTo: 'Ali B.' },
];

export const mockProfessionalActivity: ProfessionalActivityStatus = {
  total: 250,
  active: 180,
  inactive: 70,
};

export const mockListingApprovalQueue: ListingApprovalQueueItem[] = [
  { listingId: 'list101', professionalName: 'AI Solutions Co.', serviceName: 'Advanced AI Strategy', submittedDate: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), status: 'Pending Approval'},
  { listingId: 'list102', professionalName: 'Creative Designs Ltd.', serviceName: 'Brand Identity Package', submittedDate: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), status: 'Needs Revision'},
];

export const mockServiceCategoryDemand: ServiceCategoryDemand[] = [
  { categoryName: 'AI Consulting', demandScore: 90, supplyScore: 20 },
  { categoryName: 'Graphic Design', demandScore: 75, supplyScore: 60 },
  { categoryName: 'Web Development', demandScore: 80, supplyScore: 50 },
  { categoryName: 'Plumbing (Emergency)', demandScore: 85, supplyScore: 30 },
  { categoryName: 'Electrical Services', demandScore: 70, supplyScore: 45 },
];

export const mockUserSearchQueries: UserSearchQuery[] = [
  { term: 'urgent plumbing repair', count: 150 },
  { term: '24/7 electrician', count: 120 },
  { term: 'AI consultant near me', count: 90 },
  { term: 'logo design sidi bel abbes', count: 85 },
  { term: 'best doctor algiers', count: 70 },
];

export const mockSupportTickets: SupportTicketSummary[] = [
  { id: 'sup1', ticketNumber: 'TKT-2024-001', professionalName: 'Tech Innovators Inc.', issueSummary: 'Cannot update payment details', status: 'Open', priority: 'High', lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), category: 'Payment Setup'},
  { id: 'sup2', ticketNumber: 'TKT-2024-002', professionalName: 'Design Hub', issueSummary: 'Listing rejected, reason unclear', status: 'In Progress', priority: 'Medium', lastUpdate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), category: 'Listing Issue'},
  { id: 'sup3', ticketNumber: 'TKT-2024-003', professionalName: 'Ahmed Plumbing', issueSummary: 'How to mark service as emergency?', status: 'Open', priority: 'Low', lastUpdate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), category: 'Feature Usage'},
];

// Type for Top Content (Services/Products) Table
export const mockTopContent: TopContentItem[] = [
  { name: 'Pizza Royale (The Gourmet Place Algérie)', views: 1250, conversionRate: 15.2 },
  { name: 'Emergency Plumbing (Rapid Rooter)', views: 980, conversionRate: 22.5 },
  { name: 'Laptop Pro X (Tech Universe Algérie)', views: 870, conversionRate: 8.1 },
  { name: 'Logo Design Basic (Creative Pixel Studio)', views: 750, conversionRate: 12.0 },
  { name: 'General Check-up (Dr. Fatima Zohra)', views: 630, conversionRate: 18.9 },
];

// Mock data for Admin Control Panel - User Verification (Enhanced for Platform Super Admin)
export const mockAdminVerificationQueue: AdminVerificationRequestItem[] = [
    { 
      id: 'admin_ver_001', 
      applicantName: 'Fatima', 
      surname: 'Boutique',
      dateOfBirth: '1985-05-15',
      email: 'contact@boutiquechic.dz', 
      phone: '0550123456',
      requestType: 'Store', 
      entityName: 'Boutique Chic Algérie', 
      categoryOrPlan: 'pro', 
      submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'Pending',
      idCardUrl: '/mock-docs/id_fatima.pdf',
      commercialRegisterUrl: '/mock-docs/cr_boutiquechic.pdf'
    },
    { 
      id: 'admin_ver_002', 
      applicantName: 'Ahmed', 
      surname: 'Plomberie',
      dateOfBirth: '1978-11-20',
      email: 'ahmed.plomberie@service.dz', 
      phone: '0661234567',
      requestType: 'Professional', 
      entityName: 'Ahmed Plomberie Pro', 
      categoryOrPlan: 'Plumbers', 
      submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'Pending',
      idCardUrl: '/mock-docs/id_ahmed.jpg',
      commercialRegisterUrl: undefined // Professionals might not always have a commercial register
    },
    { 
      id: 'admin_ver_003', 
      applicantName: 'Karim', 
      surname: 'Gadgets',
      dateOfBirth: '1990-02-10',
      email: 'karim.user@personal.dz', 
      phone: '0770123456',
      requestType: 'Store', 
      entityName: 'Karim\'s Tech Gadgets', 
      categoryOrPlan: 'basic', 
      submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'Pending',
      idCardUrl: '/mock-docs/id_karim.pdf'
    },
    { 
      id: 'admin_ver_004', 
      applicantName: 'Leila',
      surname: 'Solutions',
      dateOfBirth: '1982-07-30', 
      email: 'info@techsolutions-sarl.dz', 
      phone: '0555123456',
      requestType: 'Professional', 
      entityName: 'Tech Solutions SARL', 
      categoryOrPlan: 'IT Services', 
      submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'Approved',
      idCardUrl: '/mock-docs/id_leila.jpg',
      commercialRegisterUrl: '/mock-docs/cr_techsolutions.pdf'
    },
];

// Mock data for Super Admin - Platform Store Management
export const mockPlatformStores: PlatformStore[] = [
    { id: 'store1', storeName: 'The Gourmet Place Algérie', ownerName: 'Ali Benmansour', ownerId: 'owner123', applicationDate: '2024-01-10T10:00:00Z', subscriptionPlan: 'pro', subscriptionStatus: 'active', isActive: true, isFeatured: true, totalProducts: 25, totalSales: 1250000 },
    { id: 'store2', storeName: 'Tech Universe Algérie', ownerName: 'Fatima Zohra Belkacem', ownerId: 'owner456', applicationDate: '2024-02-15T14:30:00Z', subscriptionPlan: 'pro', subscriptionStatus: 'active', isActive: true, isFeatured: false, totalProducts: 150, totalSales: 3500000 },
    { id: 'store3', storeName: 'Artisans d\'Algérie', ownerName: 'Yasmine Cherif', ownerId: 'owner789', applicationDate: '2024-03-01T09:00:00Z', subscriptionPlan: 'basic', subscriptionStatus: 'expired', isActive: false, isFeatured: false, totalProducts: 50, totalSales: 800000 },
    { id: 'store_pending', storeName: 'Gadgets & Gizmos', ownerName: 'Karim User', ownerId: 'user_karim', applicationDate: '2024-07-15T11:00:00Z', subscriptionPlan: 'basic', subscriptionStatus: 'pending_payment', isActive: false, isFeatured: false },
];

// Mock data for Super Admin - Platform Service Provider Management
export const mockPlatformServiceProviders: PlatformServiceProvider[] = [
    { id: 'prof1', providerName: 'Rapid Rooter Plumbing Algérie', contactEmail: 'service@rapidrooteralgerie.dz', serviceCategory: 'Plumbers', applicationDate: '2024-01-20T10:00:00Z', status: 'active', averageRating: 4.8, totalServicesListed: 5 },
    { id: 'prof2', providerName: 'Dr. Fatima Zohra', contactEmail: 'dr.fatima@clinic.dz', serviceCategory: 'Doctors', applicationDate: '2024-02-05T11:30:00Z', status: 'active', averageRating: 4.9, totalServicesListed: 10 },
    { id: 'prof_suspended', providerName: 'QuickFix Handyman', contactEmail: 'quickfix@example.dz', serviceCategory: 'Handyman', applicationDate: '2024-03-10T16:00:00Z', status: 'suspended', averageRating: 2.5, totalServicesListed: 3 },
    { id: 'prof_pending', providerName: 'Ahmed Plomberie Pro', contactEmail: 'ahmed.plomberie@service.dz', serviceCategory: 'Plumbers', applicationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending_review' },
];

// Mock data for Super Admin - Platform User Management
export const mockPlatformUsers: PlatformUser[] = [
    { id: 'superadmin01', userName: 'Khidmatik Admin', email: 'admin@khidmatik.dz', role: 'superadmin', registrationDate: '2023-01-01T00:00:00Z', status: 'active', lastLogin: new Date().toISOString() },
    { id: 'owner123', userName: 'Ali Benmansour', email: 'ali.benmansour@store.dz', role: 'vendor', registrationDate: '2024-01-10T09:00:00Z', status: 'active', lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'owner456', userName: 'Fatima Zohra Belkacem', email: 'fz.belkacem@tech.dz', role: 'vendor', registrationDate: '2024-02-15T14:00:00Z', status: 'active', lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'prof_dr_fatima', userName: 'Dr. Fatima Zohra', email: 'dr.fatima@clinic.dz', role: 'service_provider', registrationDate: '2024-02-05T11:00:00Z', status: 'active', lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
    { id: 'customer_jane', userName: 'Jane Doe', email: 'jane.doe@customer.dz', role: 'customer', registrationDate: '2023-05-10T10:00:00Z', status: 'active', lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'customer_banned', userName: 'Banned User Example', email: 'banned@example.dz', role: 'customer', registrationDate: '2024-04-01T12:00:00Z', status: 'banned', lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
];

// Mock data for Super Admin - Financial Overview
export const mockPlatformFinancialKPIs: PlatformFinancialKPI[] = [
    { title: 'Total Subscription Revenue (Month)', value: '750,000 DA', trend: { percentage: 5.2, direction: 'up'}, icon: BadgeDollarSign },
    { title: 'Aggregate Platform Sales (Month)', value: '12,500,000 DA', trend: { percentage: 8.1, direction: 'up'}, icon: TrendingUp },
    { title: 'New Subscriptions (Month)', value: '45', trend: { percentage: 10, direction: 'up'}, icon: UserPlus },
    { title: 'Active Store Subscriptions', value: '320', icon: StoreIcon },
];
