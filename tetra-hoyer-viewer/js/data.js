// Content for the viewer. Figures come from used-equipment dealer listings for
// the SF1200-N1 (see SOURCES) – the machine's own nameplate is authoritative.

export const MACHINE = {
  type: 'Tetra Hoyer Frigus SF1200-N1',
  machineNo: 'Z138, 1079',
};

// source: 'you' = supplied by the owner, 'listing' = dealer listing, 'photo' = visible in reference photos
export const SPECS = [
  { group: 'Identification', rows: [
    ['Type', 'Tetra Hoyer Frigus SF1200-N1', 'you'],
    ['Machine No.', 'Z138, 1079', 'you'],
    ['Function', 'Continuous ice-cream freezer', 'listing'],
  ] },
  { group: 'Dimensions & weight', rows: [
    ['Length', '193 cm', 'listing'],
    ['Width', '84 cm', 'listing'],
    ['Height', '200 cm', 'listing'],
    ['Weight', '≈ 1,200 kg', 'listing'],
  ] },
  { group: 'Performance', rows: [
    ['Capacity', '400 – 1,200 L/h', 'listing'],
    ['Refrigerant', 'R404A (4.5 kg)', 'listing'],
    ['Freezing cylinder', 'Horizontal', 'listing'],
  ] },
  { group: 'Electrical', rows: [
    ['Installed power', '31 kW', 'listing'],
    ['Supply', '400 V · 50 Hz · 3-phase', 'listing'],
  ] },
  { group: 'Equipment', rows: [
    ['Pumps', 'Inlet rotary pump + outlet rotary pump', 'listing'],
    ['Controls', 'PLC touch-screen panel (flow, viscosity, overrun, recipe)', 'listing'],
    ['Cleaning', 'CIP', 'listing'],
    ['Utilities', 'Power, compressed air, water, mix supply', 'listing'],
  ] },
];

export const SOURCES = [
  { label: 'Machinery World – Tetra Pak Hoyer SF Frigus 1200 N (SF1200-N1, S/N FRI250215, 2005)', href: 'https://www.machineryworld.com/product/tetra-pak-hoyer-sf-frigus-1200-n-ice-cream-continuous-freezer/' },
  { label: 'Machinery World – other Tetra Pak Hoyer SF Frigus 1200 listings', href: 'https://www.machineryworld.com/?p=8573' },
];

// Interactive hotspots. pos = world position of the marker, normal = outward direction (used to hide
// markers that face away from the camera), view = camera direction used when focusing.
export const HOTSPOTS = [
  {
    id: 'panel', title: 'Operator panel',
    pos: [-0.31, 1.82, 1.03], normal: [0, 0, 1], view: [-0.45, 0.15, 1], dist: 1.6, target: [-0.31, 1.6, 1.0],
    text: 'Touch-screen panel above a membrane button strip with the red emergency stop. Per the dealer listing, the PLC touch screen controls flow, viscosity, overrun and recipe parameters. The Hoyer Frigus SF label and blue stripe sit directly beside it.',
  },
  {
    id: 'inlet', title: 'Mix inlet pump',
    pos: [-0.03, 1.9, 1.08], normal: [0, 0.4, 1], view: [0.3, 0.2, 1], dist: 1.5, target: [0.04, 1.6, 1.05],
    text: 'Rotary pump that meters ice-cream mix into the machine. The upturned elbow is the product inlet; a sanitary line leads on to the freezing-cylinder cover. A gear-motor drives the pump head.',
  },
  {
    id: 'cover', title: 'Freezing-cylinder cover',
    pos: [0.0, 1.13, 1.11], normal: [0, 0, 1], view: [0.1, 0.05, 1], dist: 1.4, target: [0.0, 1.13, 1.0],
    text: 'Front cover of the horizontal freezing cylinder, held by three knobs. Mix is frozen on the cylinder wall and scraped off by the rotating dasher while air is whipped in (overrun). Remove it to inspect the dasher and scraper blades.',
  },
  {
    id: 'outlet', title: 'Outlet pump & discharge',
    pos: [-0.02, 0.62, 1.12], normal: [0, 0, 1], view: [0.1, 0.25, 1], dist: 1.4, target: [0.0, 0.46, 1.05],
    text: 'Rotary pump that draws finished ice cream out of the freezing cylinder. The spout below the pump is the product discharge toward the filling or extrusion line.',
  },
  {
    id: 'plate', title: 'Data plate',
    pos: [0.25, 0.8, 1.02], normal: [0, 0, 1], view: [0.1, 0.1, 1], dist: 1.2, target: [0.25, 0.8, 1.0],
    text: 'Shows the type (Tetra Hoyer Frigus SF1200-N1) and machine numbers (Z138, 1079). Position on the model is illustrative – check the physical nameplate for the authoritative ratings of your machine.',
  },
  {
    id: 'doors', title: 'Service doors',
    pos: [0.45, 1.2, -0.45], normal: [1, 0, 0], view: [1, 0.2, -0.3], dist: 3.0, target: [0.0, 1.0, -0.2],
    text: 'Two doors per side give access to the drive motor, refrigeration circuit (R404A) and electrics. Use "Open doors" in the View tab to look inside. Interior layout is schematic, not a manufacturer drawing.',
  },
  {
    id: 'feet', title: 'Adjustable feet',
    pos: [0.38, 0.1, 0.93], normal: [0.5, 0, 1], view: [0.8, 0.2, 1], dist: 1.8, target: [0.2, 0.1, 0.6],
    text: 'Four height-adjustable stainless feet level the 1.2-tonne machine. Body sits about 12 cm above the floor, which also keeps the underside washable.',
  },
];
