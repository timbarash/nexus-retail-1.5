// Ascend Wellness Holdings Consumer Sentiment Mock Data
// 550 deterministically generated reviews across multiple sources, brands, and locations

export const brands = ['Ozone', 'Ozone Reserve', 'Simply Herb', 'Common Goods', 'Tunnel Vision'];

export const sources = ['Reddit', 'Google Reviews', 'Leafly', 'Weedmaps'];

export const categories = [
  'Product Quality', 'Staff Friendliness', 'Wait Times',
  'Pricing', 'Store Atmosphere', 'Product Selection'
];

export const locations = [
  // IL (10)
  { name: 'Ascend Logan Square', state: 'IL', city: 'Chicago' },
  { name: 'Ascend Midway', state: 'IL', city: 'Chicago' },
  { name: 'Ascend River North (Outlet)', state: 'IL', city: 'Chicago' },
  { name: 'Ascend Tinley Park', state: 'IL', city: 'Tinley Park' },
  { name: 'Ascend Chicago Ridge', state: 'IL', city: 'Chicago Ridge' },
  { name: 'Ascend Collinsville', state: 'IL', city: 'Collinsville' },
  { name: 'Ascend Fairview Heights', state: 'IL', city: 'Fairview Heights' },
  { name: 'Ascend Northlake (Outlet)', state: 'IL', city: 'Northlake' },
  { name: 'Ascend Springfield Downtown', state: 'IL', city: 'Springfield' },
  { name: 'Ascend Springfield Horizon', state: 'IL', city: 'Springfield' },
  // MD (4)
  { name: 'Ascend Aberdeen', state: 'MD', city: 'Aberdeen' },
  { name: 'Ascend Crofton', state: 'MD', city: 'Crofton' },
  { name: 'Ascend Ellicott City', state: 'MD', city: 'Ellicott City' },
  { name: 'Ascend Laurel', state: 'MD', city: 'Laurel' },
  // MA (3)
  { name: 'Ascend Boston', state: 'MA', city: 'Boston' },
  { name: 'Ascend Newton', state: 'MA', city: 'Newton' },
  { name: 'Ascend New Bedford (Outlet)', state: 'MA', city: 'New Bedford' },
  // MI (7)
  { name: 'Ascend Battle Creek', state: 'MI', city: 'Battle Creek' },
  { name: 'Ascend Detroit', state: 'MI', city: 'Detroit' },
  { name: 'Ascend East Lansing', state: 'MI', city: 'East Lansing' },
  { name: 'Ascend Grand Rapids 28th St', state: 'MI', city: 'Grand Rapids' },
  { name: 'Ascend Grand Rapids Century (Outlet)', state: 'MI', city: 'Grand Rapids' },
  { name: 'Ascend Grand Rapids Scribner', state: 'MI', city: 'Grand Rapids' },
  { name: 'Ascend Morenci', state: 'MI', city: 'Morenci' },
  // NJ (4)
  { name: 'Ascend Fort Lee', state: 'NJ', city: 'Fort Lee' },
  { name: 'Ascend Little Falls', state: 'NJ', city: 'Little Falls' },
  { name: 'Ascend Rochelle Park', state: 'NJ', city: 'Rochelle Park' },
  { name: 'Ascend Wharton', state: 'NJ', city: 'Wharton' },
  // OH (6)
  { name: 'Ascend Carroll', state: 'OH', city: 'Carroll' },
  { name: 'Ascend Cincinnati', state: 'OH', city: 'Cincinnati' },
  { name: 'Ascend Coshocton', state: 'OH', city: 'Coshocton' },
  { name: 'Ascend Englewood', state: 'OH', city: 'Englewood' },
  { name: 'Ascend Piqua (Outlet)', state: 'OH', city: 'Piqua' },
  { name: 'Ascend Sandusky (Outlet)', state: 'OH', city: 'Sandusky' },
  // PA (5)
  { name: 'Ascend Cranberry (Outlet)', state: 'PA', city: 'Cranberry Township' },
  { name: 'Ascend Monaca (Outlet)', state: 'PA', city: 'Monaca' },
  { name: 'Ascend Scranton (Outlet)', state: 'PA', city: 'Scranton' },
  { name: 'Ascend Wayne (Outlet)', state: 'PA', city: 'Wayne' },
  { name: 'Ascend Whitehall (Outlet)', state: 'PA', city: 'Whitehall' },
];

// Subreddits per state
const subredditsByState = {
  IL: ['r/ILTrees', 'r/chicagotrees', 'r/trees', 'r/cannabis'],
  MD: ['r/MDEnts', 'r/trees', 'r/cannabis', 'r/medicalmarijuana'],
  MA: ['r/bostontrees', 'r/trees', 'r/cannabis', 'r/medicalmarijuana'],
  MI: ['r/Michigents', 'r/trees', 'r/cannabis', 'r/medicalmarijuana'],
  NJ: ['r/NewJerseyMarijuana', 'r/trees', 'r/cannabis', 'r/medicalmarijuana'],
  OH: ['r/OhioMarijuana', 'r/trees', 'r/cannabis', 'r/medicalmarijuana'],
  PA: ['r/PaMedicalMarijuana', 'r/trees', 'r/cannabis', 'r/medicalmarijuana'],
};

// Seeded pseudo-random number generator (Mulberry32)
// Creates a stateful RNG from a single integer seed
function createRng(seed) {
  let state = seed | 0;
  return function next() {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function rngPick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// --- Review text templates ---

const positiveTemplates = [
  'I had a terrible experience at another dispensary and called {location} to see if they could help. The manager actually called me back personally and handled everything. Never seen that level of service anywhere.',
  '{brand} carts from {location} are always reliable. Consistent oil color, consistent potency, never had a dud. Been buying them for over a year now.',
  'Was only there 15 min at {location} from check-in to walking out with my {brand} order. That is how a dispensary should run.',
  'Shoutout to the staff at {location} - they remembered my name and my usual {brand} order. That personal touch makes all the difference.',
  'The loyalty program at {location} actually saves me real money. Between the points and the daily deals I probably save 20% on {brand} products monthly.',
  '{brand} carts are always reliable. Picked up two from {location} and they are exactly what I expected. Smooth pull, good flavor, solid effects every time.',
  '{brand} never disappoints. Got the live resin cart from {location} and it is hands down the cleanest tasting vape I have used.',
  '{brand} flower from {location} is seriously underrated. Dense buds, great cure, and the terp profiles are always on point.',
  'Clean modern store at {location}. Felt like walking into an Apple store but for cannabis. {brand} products were beautifully displayed and the staff was super knowledgeable.',
  'Been buying {brand} from {location} for years and the consistency is what keeps me coming back. I know exactly what I am getting every single time.',
  'The {brand} pre-rolls from {location} burned perfectly even. Great flavor, no canoeing, proper effects. Way better than trying to roll my own honestly.',
  'In and out quick at {location}. Online order was ready when I got there, {brand} flower was fresh, staff was friendly. No complaints at all.',
  'Love that Ascend keeps opening new locations across the state. Having multiple spots nearby makes them the go-to dispensary group in the area. Bought more {brand} today from {location} to celebrate.',
  'With Ascend being in 39 locations across 7 states they have the scale to keep {brand} quality consistent. Tried it at multiple stores and it was the same great product.',
  'The {brand} edibles from {location} are perfectly dosed. 10mg per piece, effects kick in within 45 minutes, and they actually taste good. Not that fake cannabis taste some brands have.',
  'The budtender at {location} spent 20 minutes educating me on different {brand} strains and terpene profiles. As a new customer that made me feel so much more comfortable with the whole process.',
  '{location} is my go-to. The {brand} vaporizer cartridges hit smooth and the flower is always fresh. Plus the location is super convenient which is a huge bonus.',
  'Picked up {brand} concentrates from {location} today. Live badder was terpy and potent. Definitely worth the price for the quality you get.',
  'The craft cannabis focus from Ascend is making high-quality product so much more accessible. Grabbed some {brand} CBD tincture from {location} for my mom and she loves it.',
  'I was nervous about my first dispensary visit but {location} made it so easy. The staff walked me through every {brand} product option and helped me find exactly what I needed.',
  'The cannabis market is really maturing and Ascend is leading the charge. Meanwhile {brand} from {location} continues to be great quality.',
  'The market is growing fast and Ascend is positioned perfectly for it. Picked up some {brand} flower from {location} to celebrate the good vibes.',
  '{brand} tinctures from {location} have been a game changer for my sleep. Consistent dosing and I finally have a routine that works.',
  'Just want to say {location} has really stepped up their game. Store is spotless, {brand} selection is huge, and the staff genuinely seems happy to be there.',
  'Grabbed the {brand} topicals from {location} for my knee pain. Within 30 minutes I felt real relief. Have been using them daily for three months now.',
  'The {brand} capsules from {location} are exactly what I need for my medical use. Precise dosing, no smell, easy to take. Perfect for patients who do not want to smoke.',
  'Honest review: been going to {location} for 6 months buying {brand} products. Quality has been consistently good. Not perfect but reliably good, which is what matters.',
  'The {brand} concentrates at {location} are fire. Live sugar was super terpy and the effects were exactly what the strain description promised.',
  'Ascend being a multi-state operator means they have the resources to do things right. {brand} products at {location} always have proper lab testing info and packaging.',
  'Walked into {location} stressed and walked out feeling taken care of. The budtender recommended a {brand} strain for anxiety and it was exactly what I needed.',
  '{location} does express pickup right. Ordered {brand} online, got the text it was ready in 8 minutes, grabbed it from the counter and was out the door.',
  'My whole family uses {brand} products from {location}. Mom likes the tinctures, dad likes the flower, I like the carts. Something for everyone.',
  'The {brand} flower from {location} had the most beautiful trichome coverage I have seen at a dispensary. Smelled incredible out of the jar too.',
  'As a medical patient I appreciate how {location} treats me with respect and takes my needs seriously. {brand} products have genuinely improved my quality of life.',
  'Had an issue with a {brand} cart from {location} and they replaced it same day no questions asked. That is how you build customer loyalty.',
  '{location} had a great sale on {brand} last week. Stocked up on carts and flower and everything has been top quality. Love when deals align with good product.',
  'I have tried dispensaries across the state and {location} is in my top 3. {brand} product quality plus the staff knowledge makes it stand out.',
  'The {brand} live resin from {location} tastes like the actual plant. None of that distillate nonsense. You can really tell the difference in quality.',
  '{location} makes you feel like a valued customer not just a transaction. Bought {brand} flower and the budtender even helped me pick a good grinder.',
  '{brand} carts from {location} last me a solid week of daily use. Great value considering the quality. Other brands I was going through in 3-4 days.',
  'Really appreciate that {location} has knowledgeable staff who actually use {brand} products themselves. Makes the recommendations so much more authentic.',
  'The {brand} disposable vapes from {location} are perfect for on the go in the city. Compact, reliable, and the flavors are really dialed in.',
  'Ascend expanding their product lines with Common Goods and Ozone gives {location} such a solid range. Different price points, all quality.',
  'First time customer discount at {location} was generous. Got to try several {brand} products and now I know what I like. Smart way to earn a repeat customer.',
  'Been an Ascend customer since they opened {location}. Watched them improve year over year. {brand} products now are miles ahead of where they started.',
  'The {brand} flower from {location} was perfectly cured. Not too dry, not too moist, broke apart nicely. These details matter and Ascend gets it right.',
  '{location} atmosphere is professional but not cold. Clean displays, good lighting, and the budtenders make you feel welcome. {brand} products well organized too.',
  'Picked up {brand} gummies from {location} for a rooftop hangout. Consistent 10mg dosing meant I could control my experience perfectly. Great product.',
  'The patient education at {location} is what sets them apart. They have pamphlets, the staff explains everything, and they help you understand {brand} lab results.',
  'Walked past two other dispensaries to get to {location} because I trust {brand} products. Consistency over everything. Never been let down.',
  'Quick shoutout to Marcus at {location} who went above and beyond helping me pick out {brand} products for my chronic pain. He clearly cares about customers.',
  'Business stuff aside the actual {brand} products at {location} are still quality. Separating the business from the product experience here.',
  '{brand} from {location} helped me finally get off the pharmaceuticals my doctor had me on. Tinctures and capsules changed my life. Genuinely grateful.',
  'The {brand} wax from {location} is smooth, flavorful, and potent. Perfect consistency for dabbing. One of the better concentrates I have had in the city.',
  'Appreciate that {location} is always clean and well maintained. {brand} products stored properly and the whole place feels legit and professional.',
];

const negativeTemplates = [
  'DO NOT USE. UNPROFESSIONAL - they are very quick in taking the cash, you could be waiting some time for the product. {location} had me standing there for 40 minutes after paying.',
  'Waited over an hour at {location} just to pick up a pre-order. This is unacceptable. Other dispensaries have this figured out, why cant Ascend?',
  'The {brand} cart I got from {location} was noticeably half empty. Oil was dark and tasted burnt. For $50 a half gram this is robbery.',
  'Showed in stock online, drove 30 min to {location}, not available. They will not inform you ever. Complete waste of my time and gas.',
  '{location} online menu is straight up lies at this point. Third time the {brand} product I wanted was listed but not actually there when I arrived.',
  'Prices at {location} are insane compared to Curaleaf. Paying $60 for an eighth of {brand} flower that would be $40 anywhere else. No thanks.',
  'I switched to Cresco Labs and never looked back. {brand} from {location} was overpriced and the quality just was not there compared to what I get now.',
  'The {brand} flower from {location} was dry as cardboard. No moisture, no smell, crumbled to dust when I broke it apart. Old stock for sure.',
  'Got a {brand} vape cart from {location} that had dark oil and tasted like chemicals. Returned it and they acted like I was being difficult about it.',
  'Staff at {location} couldnt tell me the terpene profile of the {brand} strain I was asking about. How do you work at a dispensary and not know this basic info?',
  'Budtender at {location} clearly didnt know anything about {brand} products. Just reading off the label I can do that myself at home.',
  'The {location} location is terrible but I hear the other ones are great. Inconsistency between locations is wild for a group this big.',
  '{location} feels like a corporate machine. Zero personal touch, staff seems checked out, and {brand} products have been declining in quality.',
  'Company cant even keep their social media game together and you can feel it in the product quality at {location}. {brand} used to be so much better.',
  'I switched to Green Thumb and the difference is night and day. {brand} from {location} is overpriced mid compared to what competitors are putting out.',
  'The wait times at {location} are criminal. Went on a Saturday and it was a 90 minute wait. No dispensary visit should take that long.',
  '{brand} pre-rolls from {location} were loose, uneven, and ran like crazy. Waste of money when I could just get a jar and roll my own.',
  'Bought {brand} edibles from {location} and felt absolutely nothing. Took the full dose, waited 2 hours, nothing. Either mislabeled or just bad product.',
  '{location} staff was rude when I had questions about {brand}. Not everyone is an expert, thats literally why you have budtenders.',
  'Drove 45 minutes to {location} because their website showed {brand} in stock. Got there and they said it sold out yesterday. Update your menu.',
  'The {brand} disposable from {location} died with half the oil still in it. $35 down the drain. This has happened twice now.',
  'Nothing about {location} justified the prices. {brand} flower was average at best and they are charging premium prices for it.',
  'Got home from {location} and my {brand} product was clearly old stock. Dry flower, package date was 4 months ago. They need to rotate inventory.',
  '{brand} carts from {location} have been so inconsistent lately. Some are great and some taste like burnt rubber. Quality control is nonexistent.',
  'Avoid {location} on weekends unless you enjoy waiting in line for an hour. By the time you get in half the {brand} products are sold out anyway.',
  '{location} is giving big corporate dispensary energy and not in a good way. No soul, no personal touch, just take your money and next in line.',
  'Returned a defective {brand} cart to {location} and they made me feel like a criminal. Other dispensaries handle returns so much more professionally.',
  'The location of {location} is fine but no seating while you wait. Combine that with the long wait and subpar {brand} products and theres no reason to go here.',
  'Curaleaf has better flower, better prices, and better service than {location}. {brand} needs to step it up or they will keep losing customers.',
  '{brand} concentrates from {location} were harsh and tasted off. For what they charge I expect clean smooth dabs not this.',
  'Went to {location} for a specific {brand} strain I saw on the menu. Not only was it not in stock but the budtender didnt even suggest an alternative.',
  'Poor communication from {location}. Placed an online order for {brand}, never got a confirmation, showed up and they had no record of it.',
  'The {brand} tincture from {location} had a broken dropper. Called to report it and was on hold for 20 minutes before giving up.',
  'Honestly {location} feels like they are cutting corners everywhere. Smaller carts, drier flower, less knowledgeable staff. {brand} quality is slipping.',
  'Prices at {location} went up again. {brand} eighth now $55. Meanwhile the same quality flower is $35 at Green Thumb down the road. Do better.',
  'The checkout process at {location} is painfully slow. 4 registers and only 1 open. Had my {brand} product picked out in 2 minutes and waited 30 to pay.',
  'Had a terrible experience with {brand} from {location}. Cart was clogged right out of the package, oil was discolored, and the effects were weak.',
  'Do not trust the {location} online menu. I have been burned three times now going there for {brand} products that are not actually available.',
  'Staff turnover at {location} is clearly high. New faces every time and none of them seem to know {brand} products well. Zero consistency.',
  'For a multi-state operator you would think {location} could keep {brand} products in stock. Supply chain issues should not be the customers problem.',
  '{location} used to be my go-to but the decline in {brand} quality and the increase in prices pushed me to competitors. Sad to see.',
  'Just got the worst {brand} eighth I have ever purchased from {location}. All smalls, mostly shake at the bottom. For $50 this is embarassing.',
  'Ascend claims to be a premium brand but {brand} products at {location} are anything but. Mids at best for top shelf prices.',
];

const neutralTemplates = [
  'Went to {location} for the first time. Its fine, nothing special. {brand} flower was decent but nothing to write home about.',
  '{location} is convenient to my apartment so I go there. {brand} selection could be better but it gets the job done.',
  'The {brand} flower from {location} was kind of mid honestly. Not bad but not great. 3 out of 5.',
  'I would only recommend {location} if you are in the area and need something quick. {brand} products are standard dispensary quality.',
  'Picked up {brand} from {location}. Comparable to what Curaleaf puts out. Not better not worse just about the same.',
  '{brand} products at {location} are okay. Decent for some things, not great for others. Their carts are better than their flower imo.',
  'Average experience at {location}. {brand} quality is consistent I guess but consistency at a C+ level is still a C+.',
  'The price vs quality tradeoff at {location} is hard to justify when competitors are right around the corner. {brand} is fine but not a clear winner.',
  '{location} has gotten better over time I will admit that. {brand} products are more consistent now than they were a year ago. Still room to improve.',
  'With the market maturing the whole industry is going to change anyway. {location} is fine for now and {brand} does the job while we wait.',
  'Standard dispensary experience at {location}. Nothing particularly good or bad. {brand} products are what you expect from a big dispensary group.',
  '{brand} from {location} vs what I have gotten from Trulieve - pretty similar honestly. Big dispensary products are all starting to taste the same.',
  'Visited {location} yesterday. Clean store, fair prices. {brand} is adequate. Not switching from here but not raving about it either.',
  'The {brand} edibles from {location} are fine. Standard 10mg gummies, average flavor, does what it says on the label. Nothing more nothing less.',
  'Grabbed some {brand} carts from {location}. They are decent for the price. I have had better from Curaleaf but also worse from other places.',
  'Not bad not great. {location} is my local spot and {brand} is there so I buy it. Mainly a convenience thing if I am being honest.',
  '{brand} concentrates from {location} are middle of the road. Acceptable potency, average terp profile. Gets the job done.',
  'The staff at {location} was friendly enough. {brand} selection is limited but what they have is acceptable quality.',
  'First time buying {brand} at {location}. Its standard quality. About what I expected from a chain dispensary. Will try other options too.',
  'Compared {brand} from {location} to what I used to get at Verano. Pretty similar across the board. Chain dispensary weed is chain dispensary weed.',
  '{location} had my {brand} order ready in 15 minutes. Average wait time, average product, average experience. It is what it is.',
  'The {brand} flower from {location} looked good but effects were mild. Might try a different strain or just go back to my usual spot.',
  'Look, {location} is a dispensary and {brand} is cannabis. It does what it needs to do. I am not going to pretend it is amazing or terrible.',
  '{brand} vape from {location} works fine. Battery life is meh but the oil is decent. There are better options but also worse ones.',
  'Honestly the market news is more interesting to me than anything {location} has going on. {brand} is holding steady, which is fine I guess.',
  '{location} is improving slowly. {brand} product quality is slightly better than last year. Still not where competitors are but getting closer.',
  'Mixed feelings on {location}. The {brand} carts are solid but the flower has been inconsistent. Would give it a 3 out of 5 overall.',
  'Tried {brand} from {location} after hearing people talk about it. Its alright. Not the game changer some people make it out to be.',
  '{location} is a perfectly adequate dispensary. {brand} products are perfectly adequate cannabis. Nothing wrong with adequate.',
  'The {brand} tincture from {location} was okay. Took a while to kick in and effects were mild. Might try a higher dose next time.',
  'Decent enough selection at {location}. {brand} products are comparable to other dispensary brands. Not going out of my way for it though.',
  'Been going to {location} for a few months. {brand} is reliable if unspectacular. It is my backup option when Green Thumb is out of what I want.',
  'The atmosphere at {location} is clean and modern which is nice. {brand} products are standard. Not blowing anyone away but not disappointing either.',
];

// Reddit-specific title templates
const redditTitles = [
  '{location} haul - quick review',
  'Honest {brand} review after 6 months',
  '{brand} quality has been inconsistent lately',
  'Is {location} worth the trip?',
  'PSA: {location} online menu is wrong again',
  '{brand} vs Curaleaf - my comparison',
  'First time at {location}, thoughts',
  'Anyone else having issues with {brand} carts?',
  'Shoutout to the staff at {location}',
  'Hot take: {brand} is mid',
  '{location} wait times - is it just me?',
  'Market is growing, thoughts on Ascend?',
  'Picked up {brand} flower today - pics inside',
  'Why I stopped going to {location}',
  'Unpopular opinion: {brand} is actually decent',
  '{location} has really improved lately',
  'Just switched from Curaleaf to {location}',
  'Weekly {brand} pickup from {location}',
  'Tell me why I shouldnt go to {location}',
  'Whats the deal with {brand} quality control?',
];

// Usernames for different sources
const redditUsernames = [
  'TreesEnthusiast420', 'MMJ_Patient_2025', 'ChronicReliefSeeker', 'BudBoss99',
  'MedicalMaryJane', 'CannaConnoisseur_', 'GreenTherapy2025', 'TerpHunterX',
  'DabDaddy_MI', 'MidwestFlowerFan', 'IL_CannaPatient', 'DetroitDabber',
  'PurplePuffington', 'HashishHealer', 'mmjpatient2025', 'WaxWizard808',
  'SativaSweet', 'IndicaIndy', 'CannabisCarla', 'HerbHeaven23',
  'TrichomeCollector', 'VapeNation_OH', 'EdibleExplorer', 'BudgetBud420',
  'QualityQuest_MMJ', 'DailyDabber_', 'THCtherapist', 'CouchLockKing',
  'RosinRanger', 'CartConnoisseur', 'WeedWatcher2025', 'StoneySam_',
  'CannaCurious_NJ', 'ChiTownStoner', 'MassTrees_', 'PA_MedPatient',
  'AscendFan420', 'OhioTreehead', 'GardenStatePuffs', 'HighHiker_',
];

const googleUsernames = [
  'John M.', 'Sarah L.', 'Mike R.', 'Lisa T.', 'David K.', 'Jennifer W.',
  'Chris B.', 'Amanda P.', 'Robert S.', 'Emily H.', 'James D.', 'Michelle F.',
  'Brian G.', 'Stephanie N.', 'Kevin C.', 'Rachel A.', 'Mark V.', 'Laura J.',
  'Daniel Z.', 'Nicole E.', 'Thomas Q.', 'Jessica Y.', 'Andrew O.', 'Megan I.',
  'Steven U.', 'Ashley X.', 'Paul W.', 'Katie M.', 'Ryan L.', 'Hannah K.',
  'Eric T.', 'Samantha R.', 'Justin P.', 'Olivia B.', 'Tyler S.', 'Emma D.',
  'Brandon H.', 'Sophia G.', 'Nathan F.', 'Alyssa C.',
];

const leaflyUsernames = [
  'BudReviewer_2025', 'CannaCritic420', 'StrainSleuth', 'TerpProfile',
  'FlowerPower_MMJ', 'WeedWise', 'HighNote_', 'GreenGrade',
  'LeafLover23', 'BudScore', 'StonerScientist', 'CannabisRater',
  'PotPurveyor', 'HerbHero_', 'DankDiaries', 'BluntReviews',
  'NugNerd420', 'cannabisking', 'mmj_reviewer', 'TokerTester',
  'GanjGuru', 'WeedWords', 'StrainGainz', 'BudgetBlaze',
  'AscendCritic', 'FlowerFinder_', 'VapeVerdict', 'edible_expert',
  'PotPatient', 'DabDetective',
];

const weedmapsUsernames = [
  'LocalBuddy420', 'DispensaryHunter', 'WeedMapsPro', 'NearbyNugs',
  'MapMyMeds', 'BudFinder_', 'CannaLocator', 'GreenMap23',
  'FindMyFlower', 'mmj_mapper', 'DispoReview_', 'HerbHunter',
  'NugNavigator', 'WeedSeeker_', 'MapMyDabs', 'CannaExplorer',
  'LocalLeaf420', 'DispoDeal', 'BudBrowser_', 'FindMyTerps',
  'GreenGuide_', 'HerbGPS', 'mmj_locator', 'NugQuest',
  'TreeTracker', 'CannaCrawler', 'WeedWatch_', 'MapMyGreen',
  'DispoFinder', 'BudMap420',
];

function generateReview(index) {
  // Each review gets its own RNG seeded uniquely from the index
  const rng = createRng(index * 9973 + 42);

  // Source distribution: ~25% Reddit, ~35% Google, ~20% Leafly, ~20% Weedmaps
  const sourceRoll = rng();
  let source;
  if (sourceRoll < 0.25) source = 'Reddit';
  else if (sourceRoll < 0.60) source = 'Google Reviews';
  else if (sourceRoll < 0.80) source = 'Leafly';
  else source = 'Weedmaps';

  // Location
  const location = rngPick(rng, locations);

  // Sentiment distribution: ~40% positive, ~30% neutral, ~30% negative
  const sentRoll = rng();
  let sentiment, templates;
  if (sentRoll < 0.40) {
    sentiment = 'positive';
    templates = positiveTemplates;
  } else if (sentRoll < 0.70) {
    sentiment = 'neutral';
    templates = neutralTemplates;
  } else {
    sentiment = 'negative';
    templates = negativeTemplates;
  }

  // Brand: ~60% have a brand, ~40% null
  const brandRoll = rng();
  const brand = brandRoll < 0.60 ? rngPick(rng, brands) : null;
  // displayBrand is used in template text even if brand field is null
  const displayBrand = brand || rngPick(rng, brands);

  // Pick template and fill in
  const template = rngPick(rng, templates);
  let text = template.replace(/{brand}/g, displayBrand).replace(/{location}/g, location.name);

  // Sentiment score
  let sentimentScore;
  if (sentiment === 'positive') {
    sentimentScore = Math.round((0.4 + rng() * 0.6) * 100) / 100;
  } else if (sentiment === 'neutral') {
    sentimentScore = Math.round((-0.25 + rng() * 0.5) * 100) / 100;
  } else {
    sentimentScore = Math.round((-1.0 + rng() * 0.55) * 100) / 100;
  }

  // Rating (null for Reddit)
  let rating = null;
  if (source !== 'Reddit') {
    if (sentiment === 'positive') {
      rating = rng() < 0.7 ? 5 : 4;
    } else if (sentiment === 'neutral') {
      const rr = rng();
      if (rr < 0.5) rating = 3;
      else if (rr < 0.8) rating = 4;
      else rating = 2;
    } else {
      const rr = rng();
      if (rr < 0.5) rating = 1;
      else if (rr < 0.8) rating = 2;
      else rating = 3;
    }
  }

  // Date: Mar 2025 - Feb 2026
  const monthOffset = Math.floor(rng() * 12); // 0-11
  const baseMonth = 2 + monthOffset; // March=2 (0-indexed) through Feb next year
  const year = baseMonth > 11 ? 2026 : 2025;
  const month = (baseMonth % 12) + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = Math.floor(rng() * daysInMonth) + 1;
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Categories: 1-3
  const numCats = rngInt(rng, 1, 3);
  // Shuffle categories deterministically using rng
  const catsCopy = [...categories];
  for (let c = catsCopy.length - 1; c > 0; c--) {
    const j = Math.floor(rng() * (c + 1));
    [catsCopy[c], catsCopy[j]] = [catsCopy[j], catsCopy[c]];
  }
  const reviewCategories = catsCopy.slice(0, numCats);

  // Author
  let author;
  if (source === 'Reddit') {
    author = rngPick(rng, redditUsernames);
  } else if (source === 'Google Reviews') {
    author = rngPick(rng, googleUsernames);
  } else if (source === 'Leafly') {
    author = rngPick(rng, leaflyUsernames);
  } else {
    author = rngPick(rng, weedmapsUsernames);
  }

  // Subreddit (Reddit only)
  const stateSubreddits = subredditsByState[location.state] || ['r/trees', 'r/cannabis'];
  const subreddit = source === 'Reddit' ? rngPick(rng, stateSubreddits) : null;

  // Title (Reddit only, ~70% of the time)
  let title = null;
  if (source === 'Reddit' && rng() < 0.7) {
    const titleTemplate = rngPick(rng, redditTitles);
    title = titleTemplate.replace(/{brand}/g, displayBrand).replace(/{location}/g, location.name);
  }

  // Helpful count
  const helpful = Math.floor(rng() * (source === 'Reddit' ? 150 : 30));

  return {
    id: index + 1,
    source,
    text,
    rating,
    sentiment,
    sentimentScore,
    date,
    location: location.name,
    state: location.state,
    brand,
    categories: reviewCategories,
    author,
    subreddit,
    helpful,
    title,
  };
}

export const reviews = Array.from({ length: 550 }, (_, i) => generateReview(i));
