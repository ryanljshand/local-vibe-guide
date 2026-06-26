import iconCoffee      from '@/assets/icon-coffee.png';
import iconBook        from '@/assets/icon-book.png';
import iconHike        from '@/assets/icon-hike.png';
import iconFood        from '@/assets/icon-food.png';
import iconArt         from '@/assets/icon-art.png';
import iconDrinks      from '@/assets/icon-drinks.png';
import iconShop        from '@/assets/icon-shop.png';
import cardCafe        from '@/assets/card-cafe.jpg';
import cardPark        from '@/assets/card-park.jpg';
import cardNeighborhood from '@/assets/card-neighborhood.jpg';

export type TileColor = 'amber' | 'blue' | 'green' | 'peach' | 'lavender' | 'pink' | 'yellow' | 'sage';

export interface VibeTile {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  color: TileColor;
  subVibes?: SubVibeTile[];
}

export interface SubVibeTile {
  id: string;
  label: string;
  icon: string;
  color: TileColor;
  activities: Activity[];
}

export interface Activity {
  id: string;
  name: string;
  tagline: string;
  address: string;
  neighborhood: string;
  image: string;
  tags: string[];
  walkTime: string;
}

export function getAllActivities(): Activity[] {
  return vibeData.flatMap((vibe) => vibe.subVibes?.flatMap((sub) => sub.activities) ?? []);
}

export function getActivitiesByIds(ids: string[]): Activity[] {
  const byId = new Map(getAllActivities().map((a) => [a.id, a]));
  return ids.map((id) => byId.get(id)).filter((a): a is Activity => Boolean(a));
}

export const vibeData: VibeTile[] = [
  {
    id: 'caffeine',
    label: 'Getting a caffeine fix',
    sublabel: 'you need a good cup, stat',
    icon: iconCoffee,
    color: 'amber',
    subVibes: [
      {
        id: 'cozy-cafe',
        label: 'A cozy corner cafe',
        icon: iconCoffee,
        color: 'amber',
        activities: [
          { id: 'c1', name: 'Stumptown Coffee Roasters', tagline: 'Serious beans, even more serious vibes', address: '128 SW 3rd Ave', neighborhood: 'Old Town', image: cardCafe, tags: ['Pour-over', 'Cozy seating', 'Laptop-friendly'], walkTime: '8 min' },
          { id: 'c2', name: 'Heart Coffee Roasters', tagline: 'Where every cup is a tiny work of art', address: '537 SW 12th Ave', neighborhood: 'West End', image: cardCafe, tags: ['Latte art', 'Light roasts', 'Quiet'], walkTime: '12 min' },
          { id: 'c3', name: 'Water Avenue Coffee', tagline: 'Industrial cool meets perfect espresso', address: '1028 SE Water Ave', neighborhood: 'Central Eastside', image: cardCafe, tags: ['Espresso bar', 'Open kitchen', 'Roastery'], walkTime: '18 min' },
        ],
      },
      {
        id: 'grab-and-go',
        label: 'Quick grab and go',
        icon: iconCoffee,
        color: 'yellow',
        activities: [
          { id: 'g1', name: 'Spella Caffe', tagline: 'Tiny cart, massive flavor, no fuss', address: 'SW Alder St', neighborhood: 'Downtown', image: cardCafe, tags: ['Street cart', 'Cash only', 'Fast'], walkTime: '4 min' },
          { id: 'g2', name: 'Never Coffee', tagline: 'Always coffee, never a bad mood', address: '4243 SE Belmont St', neighborhood: 'Sunnyside', image: cardCafe, tags: ['Drive-thru', 'Cold brew', 'Quick'], walkTime: '6 min' },
        ],
      },
    ],
  },
  {
    id: 'hiding',
    label: 'Hiding from the rain',
    sublabel: 'dry and somewhere interesting',
    icon: iconBook,
    color: 'blue',
    subVibes: [
      {
        id: 'bookstore',
        label: 'Quiet indie bookstores',
        icon: iconBook,
        color: 'blue',
        activities: [
          { id: 'b1', name: "Powell's City of Books", tagline: "The world's largest independent bookstore — get gloriously lost", address: '1005 W Burnside St', neighborhood: 'Pearl District', image: cardNeighborhood, tags: ['Massive selection', 'New & used', 'Map provided'], walkTime: '10 min' },
          { id: 'b2', name: "Annie Bloom's Books", tagline: 'A neighborhood treasure since 1978', address: '7834 SW Capitol Hwy', neighborhood: 'Multnomah Village', image: cardNeighborhood, tags: ['Independent', 'Community picks', 'Cozy'], walkTime: '22 min' },
        ],
      },
      {
        id: 'museum',
        label: 'Museums and galleries',
        icon: iconArt,
        color: 'lavender',
        activities: [
          { id: 'm1', name: 'Portland Art Museum', tagline: "The Pacific Northwest's finest cultural anchor", address: '1219 SW Park Ave', neighborhood: 'South Park Blocks', image: cardNeighborhood, tags: ['World class', 'Free Fridays', 'Rotating exhibits'], walkTime: '14 min' },
          { id: 'm2', name: 'Oregon Historical Society', tagline: "Surprisingly gripping. You'll stay way longer than planned.", address: '1200 SW Park Ave', neighborhood: 'South Park Blocks', image: cardNeighborhood, tags: ['History', 'Interactive', 'Free for kids'], walkTime: '13 min' },
        ],
      },
    ],
  },
  {
    id: 'exploring',
    label: 'Exploring hidden gems',
    sublabel: 'off the tourist trail, all the local flavor',
    icon: iconHike,
    color: 'green',
    subVibes: [
      {
        id: 'nature',
        label: 'Parks and nature spots',
        icon: iconHike,
        color: 'green',
        activities: [
          { id: 'n1', name: 'Forest Park', tagline: 'One of the largest urban forests in the US — right inside the city', address: 'NW Thurman St', neighborhood: 'Northwest District', image: cardPark, tags: ['80+ miles of trails', 'Old-growth', 'Dog-friendly'], walkTime: '20 min' },
          { id: 'n2', name: 'Tom McCall Waterfront Park', tagline: 'The river, the skyline, and your best afternoon walk', address: 'SW Naito Pkwy', neighborhood: 'Downtown Waterfront', image: cardPark, tags: ['Riverfront', 'Bikes', 'Farmers Market nearby'], walkTime: '5 min' },
        ],
      },
      {
        id: 'neighborhoods',
        label: 'Walkable neighborhoods',
        icon: iconShop,
        color: 'sage',
        activities: [
          { id: 'nb1', name: 'Alberta Arts District', tagline: 'Street murals, indie shops, and all the creative energy', address: 'NE Alberta St', neighborhood: 'Northeast Portland', image: cardNeighborhood, tags: ['Art', 'Vintage shops', 'Food carts'], walkTime: '25 min' },
          { id: 'nb2', name: 'Mississippi Ave', tagline: 'Vinyl records, craft beer, zero pretension', address: 'N Mississippi Ave', neighborhood: 'Boise', image: cardNeighborhood, tags: ['Boutiques', 'Music', 'Great brunch'], walkTime: '22 min' },
        ],
      },
    ],
  },
  {
    id: 'eat',
    label: 'Eating something amazing',
    sublabel: 'your stomach is running this show',
    icon: iconFood,
    color: 'peach',
    subVibes: [
      {
        id: 'food-cart',
        label: 'Hit a food cart pod',
        icon: iconFood,
        color: 'peach',
        activities: [
          { id: 'f1', name: 'Cartopia', tagline: 'Late-night heaven — pierogies, crepes, and pure chaos', address: 'SE 12th & Hawthorne', neighborhood: 'Hawthorne', image: cardCafe, tags: ['Late night', 'Eclectic', 'Cash & card'], walkTime: '18 min' },
          { id: 'f2', name: 'Portland Mercado', tagline: 'Latin-inspired food pod with serious local love', address: '7238 SE Foster Rd', neighborhood: 'Foster-Powell', image: cardNeighborhood, tags: ['Latin food', 'Indoor seating', 'Market'], walkTime: '28 min' },
        ],
      },
      {
        id: 'sit-down',
        label: 'Sit-down spots',
        icon: iconFood,
        color: 'yellow',
        activities: [
          { id: 's1', name: 'Tasty n Daughters', tagline: 'Brunch lines that are completely worth it, every single time', address: '3808 N Williams Ave', neighborhood: 'Boise', image: cardCafe, tags: ['Brunch icon', 'Seasonal menu', 'Worth the wait'], walkTime: '20 min' },
          { id: 's2', name: 'Pok Pok', tagline: "Thai street food that changed Portland's food scene forever", address: '3226 SE Division St', neighborhood: 'Richmond', image: cardCafe, tags: ['Thai', 'James Beard', 'Communal tables'], walkTime: '22 min' },
        ],
      },
    ],
  },
  {
    id: 'culture',
    label: 'Soaking up some culture',
    sublabel: 'feed the brain, look like you planned it',
    icon: iconArt,
    color: 'lavender',
    subVibes: [
      {
        id: 'gallery',
        label: 'Galleries and street art',
        icon: iconArt,
        color: 'lavender',
        activities: [
          { id: 'a1', name: 'Disjecta Contemporary Art Center', tagline: "Where Portland's weirdest, best art lives", address: '8371 N Interstate Ave', neighborhood: 'Kenton', image: cardNeighborhood, tags: ['Free admission', 'Contemporary', 'Community-run'], walkTime: '30 min' },
          { id: 'a2', name: 'Dossier Hotel Lobby Art', tagline: "The hotel lobby that's actually a real gallery", address: '750 SW Alder St', neighborhood: 'Downtown', image: cardCafe, tags: ['Free', 'Rotating', 'Downtown'], walkTime: '6 min' },
        ],
      },
      {
        id: 'live-show',
        label: 'Live shows and venues',
        icon: iconArt,
        color: 'pink',
        activities: [
          { id: 'ls1', name: 'Revolution Hall', tagline: 'An old high school. Now one of the best music venues in the west.', address: '1300 SE Stark St', neighborhood: 'Buckman', image: cardNeighborhood, tags: ['Live music', 'All ages', 'Bar'], walkTime: '18 min' },
          { id: 'ls2', name: 'Mississippi Studios', tagline: 'Intimate, sweaty, and absolutely electric', address: '3939 N Mississippi Ave', neighborhood: 'Boise', image: cardNeighborhood, tags: ['Indie acts', 'Intimate', 'Bar + restaurant'], walkTime: '24 min' },
        ],
      },
    ],
  },
  {
    id: 'drinks',
    label: 'Getting a drink somewhere good',
    sublabel: 'the right bar changes everything',
    icon: iconDrinks,
    color: 'pink',
    subVibes: [
      {
        id: 'craft-beer',
        label: 'Craft beer taprooms',
        icon: iconDrinks,
        color: 'amber',
        activities: [
          { id: 'cb1', name: 'Deschutes Brewery Portland', tagline: "Bend's finest pint, right in the Pearl", address: '210 NW 11th Ave', neighborhood: 'Pearl District', image: cardCafe, tags: ['15+ taps', 'Full kitchen', 'Dog-friendly patio'], walkTime: '12 min' },
          { id: 'cb2', name: 'Base Camp Brewing', tagline: 'Adventure-themed. The beers absolutely deliver.', address: '930 SE Oak St', neighborhood: 'Central Eastside', image: cardCafe, tags: ['Outdoor patio', 'Food trucks', 'Seasonal releases'], walkTime: '15 min' },
        ],
      },
      {
        id: 'cocktail',
        label: 'Cocktail bars',
        icon: iconDrinks,
        color: 'pink',
        activities: [
          { id: 'ck1', name: 'Pepe le Moko', tagline: 'Underground grotto, legendary cocktails, no apologies', address: '407 SW 10th Ave', neighborhood: 'Downtown', image: cardCafe, tags: ['Subterranean', 'Classics', 'No loud music'], walkTime: '7 min' },
          { id: 'ck2', name: 'Expatriate', tagline: 'Snacks and cocktails until 2am. A perfect Portland night.', address: '5424 NE 30th Ave', neighborhood: 'Beaumont-Wilshire', image: cardCafe, tags: ['Late night', 'Asian-inspired snacks', 'Cult favorite'], walkTime: '28 min' },
        ],
      },
    ],
  },
  {
    id: 'browse',
    label: 'Wandering and shopping',
    sublabel: 'you are "just looking" but we both know',
    icon: iconShop,
    color: 'yellow',
    subVibes: [
      {
        id: 'vintage',
        label: 'Vintage and thrift',
        icon: iconShop,
        color: 'yellow',
        activities: [
          { id: 'v1', name: 'Monograph Bookwerks', tagline: 'Art books and design journals in a perfect little cave', address: '5005 NE 27th Ave', neighborhood: 'Concordia', image: cardNeighborhood, tags: ['Art books', 'Rare finds', 'Small & curated'], walkTime: '26 min' },
          { id: 'v2', name: 'Red Light Clothing Exchange', tagline: 'The vintage store Portland was born to have', address: '3590 SE Hawthorne Blvd', neighborhood: 'Hawthorne', image: cardNeighborhood, tags: ['Designer vintage', 'Consignment', 'Huge selection'], walkTime: '20 min' },
        ],
      },
      {
        id: 'indie-shops',
        label: 'Independent boutiques',
        icon: iconShop,
        color: 'sage',
        activities: [
          { id: 'is1', name: 'Tender Loving Empire', tagline: 'Local makers, weird gifts, feels like Portland in a bottle', address: '412 SW 10th Ave', neighborhood: 'Downtown', image: cardNeighborhood, tags: ['Local makers', 'Gifts', 'Music too'], walkTime: '8 min' },
          { id: 'is2', name: 'Kiriko Made', tagline: 'Japanese textiles made into beautiful everyday wearables', address: '525 NW 23rd Ave', neighborhood: 'Nob Hill', image: cardNeighborhood, tags: ['Handmade', 'Unique', 'Ethical fashion'], walkTime: '22 min' },
        ],
      },
    ],
  },
  {
    id: 'outdoors',
    label: 'Getting some fresh air',
    sublabel: 'screens off, legs on',
    icon: iconHike,
    color: 'sage',
    subVibes: [
      {
        id: 'easy-walk',
        label: 'Easy walks and strolls',
        icon: iconHike,
        color: 'green',
        activities: [
          { id: 'ew1', name: 'Eastbank Esplanade', tagline: 'The river walk that makes Portland look its best', address: 'SE Caruthers St', neighborhood: 'Inner Southeast', image: cardPark, tags: ['Flat', 'Waterfront', 'Bike-friendly'], walkTime: '10 min' },
          { id: 'ew2', name: 'Lan Su Chinese Garden', tagline: 'Unexpected serenity in the middle of everything', address: '239 NW Everett St', neighborhood: 'Chinatown', image: cardPark, tags: ['Garden', 'Teahouse', 'Peaceful'], walkTime: '8 min' },
        ],
      },
      {
        id: 'serious-hike',
        label: 'Actually break a sweat',
        icon: iconHike,
        color: 'sage',
        activities: [
          { id: 'sh1', name: 'Pittock Mansion Trail', tagline: 'Short hike, massive Portland payoff at the top', address: '3229 NW Pittock Dr', neighborhood: 'Northwest Heights', image: cardPark, tags: ['3.8 miles', 'City views', 'Historic mansion'], walkTime: '35 min' },
          { id: 'sh2', name: 'Powell Butte Nature Park', tagline: 'Volcano summit. City panorama. Actually wild inside city limits.', address: '16160 SE Powell Blvd', neighborhood: 'Centennial', image: cardPark, tags: ['Summit views', 'Mountain biking', 'Wildlife'], walkTime: '40 min' },
        ],
      },
    ],
  },
];
