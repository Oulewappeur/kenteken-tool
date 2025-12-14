import React, { useState, useEffect, useRef } from 'react';
import { Settings, Printer, AlignCenter, AlignLeft, AlignRight, AlignJustify, Move, Database, Info, AlertTriangle, ArrowRightLeft, CheckCircle2, Scissors, Ruler, Type, ArrowLeftRight, ZoomIn, Maximize } from 'lucide-react';

// Standaard afmetingen (basis waarden in inches voor interne logica)
const PRESETS = {
  US: { width: 12, height: 6 }, // Inches
  NL: { width: 20.472, height: 4.331 } // ~520x110mm
};

const CHAR_SPECS = {
  width: 1,         // 1 inch breed (25.4mm)
  height: 2.5625,   // 2.5625 inch hoog (65.0875mm)
  // Spacing is nu dynamisch, default was 0.375
};

// Conversie helpers
const INCH_TO_MM = 25.4;
const MM_TO_INCH = 1 / 25.4;

const round = (val, decimals = 2) => Number(Math.round(val + "e" + decimals) + "e-" + decimals);

// Helper om veilige getallen te gebruiken (voorkomt NaN crashes)
const safeFloat = (val) => {
  if (val === '' || val === null || val === undefined) return 0;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// Volledige dataset van de gebruiker (Fusion360 export in mm)
const INITIAL_HOLE_DATA = {
  "0": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -12.902, "y": -4.913, "diameter": 4.5 }, { "x": -3.553, "y": -34.178, "diameter": 4.5 }, { "x": -12.783, "y": -59.753, "diameter": 4.5 }, { "x": -22.014, "y": -34.022, "diameter": 4.5 } ] },
  "1": { "width": 25.4, "height": 65.0875, "pinCount": 2, "pins": [ { "x": -13.572, "y": -58.53, "diameter": 4.5 }, { "x": -15.402, "y": -5.371, "diameter": 4.5 } ] },
  "2": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.979, "y": -5.595, "diameter": 4.5 }, { "x": -21.329, "y": -5.595, "diameter": 4.5 }, { "x": -9.147, "y": -29.494, "diameter": 4.5 }, { "x": -12.747, "y": -59.597, "diameter": 4.5 } ] },
  "3": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -12.986, "y": -5.324, "diameter": 4.5 }, { "x": -12.931, "y": -59.938, "diameter": 4.5 }, { "x": -16.999, "y": -34.432, "diameter": 4.5 } ] },
  "4": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -19.365, "y": -5.414, "diameter": 4.5 }, { "x": -3.5, "y": -16.949, "diameter": 4.5 }, { "x": -17.608, "y": -59.761, "diameter": 4.5 } ] },
  "5": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -4.055, "y": -11.17, "diameter": 4.5 }, { "x": -22.183, "y": -21.985, "diameter": 4.5 }, { "x": -4.017, "y": -59.693, "diameter": 4.5 }, { "x": -21.379, "y": -60.371, "diameter": 4.5 } ] },
  "6": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.629, "y": -19.398, "diameter": 4.5 }, { "x": -22.075, "y": -18.715, "diameter": 4.5 }, { "x": -21.487, "y": -53.637, "diameter": 4.5 }, { "x": -3.505, "y": -44.839, "diameter": 4.5 } ] },
  "7": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -9.639, "y": -5.43, "diameter": 4.5 }, { "x": -3.5, "y": -60.587, "diameter": 4.5 }, { "x": -21.31, "y": -59.587, "diameter": 4.5 } ] },
  "8": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.365, "y": -19.749, "diameter": 4.5 }, { "x": -22.089, "y": -19.69, "diameter": 4.5 }, { "x": -22.089, "y": -48.056, "diameter": 4.5 }, { "x": -3.365, "y": -48.114, "diameter": 4.5 } ] },
  "9": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.894, "y": -11.516, "diameter": 4.5 }, { "x": -21.876, "y": -20.899, "diameter": 4.5 }, { "x": -21.753, "y": -47.022, "diameter": 4.5 }, { "x": -3.306, "y": -47.022, "diameter": 4.5 } ] },
  "A": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -4.467, "y": -6.354, "diameter": 4.5 }, { "x": -21.616, "y": -6.354, "diameter": 4.5 }, { "x": -12.473, "y": -58.788, "diameter": 4.5 } ] },
  "B": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -5.001, "y": -6.56, "diameter": 4.5 }, { "x": -21.413, "y": -18.101, "diameter": 4.5 }, { "x": -5.035, "y": -58.788, "diameter": 4.5 }, { "x": -21.424, "y": -44.44, "diameter": 4.5 } ] },
  "C": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -21.366, "y": -54.421, "diameter": 4.5 }, { "x": -21.458, "y": -11.238, "diameter": 4.5 }, { "x": -3.626, "y": -32.83, "diameter": 4.5 } ] },
  "D": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -5, "y": -58.646, "diameter": 4.5 }, { "x": -5, "y": -6.31, "diameter": 4.5 }, { "x": -21.202, "y": -54.192, "diameter": 4.5 }, { "x": -21.202, "y": -10.803, "diameter": 4.5 } ] },
  "E": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.59, "y": -5.361, "diameter": 4.5 }, { "x": -22.282, "y": -5.361, "diameter": 4.5 }, { "x": -3.59, "y": -60, "diameter": 4.5 }, { "x": -22.431, "y": -59.967, "diameter": 4.5 } ] },
  "F": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.646, "y": -6.443, "diameter": 4.5 }, { "x": -10.4, "y": -33.727, "diameter": 4.5 }, { "x": -3.646, "y": -59.967, "diameter": 4.5 }, { "x": -21.431, "y": -59.967, "diameter": 4.5 } ] },
  "G": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -12.108, "y": -5.098, "diameter": 4.5 }, { "x": -17.07, "y": -27.514, "diameter": 4.5 }, { "x": -3.193, "y": -33.28, "diameter": 4.5 }, { "x": -12.07, "y": -60.259, "diameter": 4.5 } ] },
  "H": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -21.199, "y": -59.463, "diameter": 4.5 }, { "x": -3.961, "y": -59.475, "diameter": 4.5 }, { "x": -21.19, "y": -5.396, "diameter": 4.5 }, { "x": -3.961, "y": -5.385, "diameter": 4.5 } ] },
  "I": { "width": 25.4, "height": 65.0875, "pinCount": 2, "pins": [ { "x": -12.654, "y": -5.465, "diameter": 4.5 }, { "x": -12.468, "y": -59.223, "diameter": 4.5 } ] },
  "J": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -3.991, "y": -11.517, "diameter": 4.5 }, { "x": -21.901, "y": -59.463, "diameter": 4.5 }, { "x": -21.781, "y": -12.517, "diameter": 4.5 } ] },
  "K": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.574, "y": -5.396, "diameter": 4.5 }, { "x": -20.612, "y": -5.396, "diameter": 4.5 }, { "x": -18.546, "y": -59.424, "diameter": 4.5 }, { "x": -3.501, "y": -59.424, "diameter": 4.5 } ] },
  "L": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -3.572, "y": -5.517, "diameter": 4.5 }, { "x": -21.375, "y": -5.56, "diameter": 4.5 }, { "x": -3.572, "y": -59.593, "diameter": 4.5 } ] },
  "M": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.579, "y": -59.489, "diameter": 4.5 }, { "x": -21.836, "y": -59.489, "diameter": 4.5 }, { "x": -21.893, "y": -5.498, "diameter": 4.5 }, { "x": -3.182, "y": -5.398, "diameter": 4.5 } ] },
  "N": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.685, "y": -5.404, "diameter": 4.5 }, { "x": -21.922, "y": -59.749, "diameter": 4.5 }, { "x": -21.922, "y": -5.404, "diameter": 4.5 }, { "x": -3.685, "y": -59.749, "diameter": 4.5 } ] },
  "O": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.345, "y": -32.732, "diameter": 4.5 }, { "x": -12.813, "y": -5.03, "diameter": 4.5 }, { "x": -21.903, "y": -32.732, "diameter": 4.5 }, { "x": -12.851, "y": -60.24, "diameter": 4.5 } ] },
  "P": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -4.515, "y": -59.084, "diameter": 4.5 }, { "x": -3.515, "y": -5.404, "diameter": 4.5 }, { "x": -21.865, "y": -46.808, "diameter": 4.5 } ] },
  "Q": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -12.851, "y": -5.049, "diameter": 4.5 }, { "x": -3.458, "y": -32.752, "diameter": 4.5 }, { "x": -21.903, "y": -32.732, "diameter": 4.5 }, { "x": -12.851, "y": -60.26, "diameter": 4.5 } ] },
  "R": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.366, "y": -4.404, "diameter": 4.5 }, { "x": -21.718, "y": -4.404, "diameter": 4.5 }, { "x": -21.766, "y": -46.33, "diameter": 4.5 }, { "x": -3.366, "y": -60.284, "diameter": 4.5 } ] },
  "S": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -12.909, "y": -33.96, "diameter": 4.5 }, { "x": -12.889, "y": -4.854, "diameter": 4.5 }, { "x": -12.926, "y": -60.216, "diameter": 4.5 } ] },
  "-": { "width": 25.4, "height": 65.0875, "pinCount": 2, "pins": [ { "x": -9.932, "y": -33.134, "diameter": 4.5 }, { "x": -16.677, "y": -33.193, "diameter": 4.5 } ] },
  "T": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -12.817, "y": -5.404, "diameter": 4.5 }, { "x": -21.452, "y": -59.519, "diameter": 4.5 }, { "x": -4.018, "y": -59.617, "diameter": 4.5 } ] },
  "U": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -12.889, "y": -4.854, "diameter": 4.5 }, { "x": -3.534, "y": -60.749, "diameter": 4.5 }, { "x": -21.922, "y": -60.749, "diameter": 4.5 } ] },
  "V": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -12.758, "y": -8.25, "diameter": 4.5 }, { "x": -3.867, "y": -59.749, "diameter": 4.5 }, { "x": -21.368, "y": -59.749, "diameter": 4.5 } ] },
  "W": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -6.445, "y": -5.404, "diameter": 4.5 }, { "x": -19.478, "y": -5.404, "diameter": 4.5 }, { "x": -21.944, "y": -59.632, "diameter": 4.5 }, { "x": -3.258, "y": -59.632, "diameter": 4.5 } ] },
  "X": { "width": 25.4, "height": 65.0875, "pinCount": 4, "pins": [ { "x": -3.974, "y": -4.945, "diameter": 4.5 }, { "x": -21.308, "y": -4.924, "diameter": 4.5 }, { "x": -21.539, "y": -60.132, "diameter": 4.5 }, { "x": -3.748, "y": -60.132, "diameter": 4.5 } ] },
  "Y": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -12.662, "y": -5.306, "diameter": 4.5 }, { "x": -22.112, "y": -60.132, "diameter": 4.5 }, { "x": -3.483, "y": -60.132, "diameter": 4.5 } ] },
  "Z": { "width": 25.4, "height": 65.0875, "pinCount": 3, "pins": [ { "x": -12.657, "y": -5.702, "diameter": 4.5 }, { "x": -12.709, "y": -32.502, "diameter": 4.5 }, { "x": -12.747, "y": -59.636, "diameter": 4.5 } ] }
};

export default function App() {
  const [text, setText] = useState("DASLOODS");
  const [unit, setUnit] = useState("mm"); 
  const [plateType, setPlateType] = useState("US"); 
  const [plateWidth, setPlateWidth] = useState(round(PRESETS.US.width * 25.4));
  const [plateHeight, setPlateHeight] = useState(round(PRESETS.US.height * 25.4));
  
  const [charLimit, setCharLimit] = useState(8); 
  const [spacing, setSpacing] = useState(round(0.375 * 25.4)); // Default spacing 9.525mm

  const [alignH, setAlignH] = useState("center");
  const [alignV, setAlignV] = useState("center");
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [holeDataInput, setHoleDataInput] = useState(JSON.stringify(INITIAL_HOLE_DATA, null, 2));
  const [parsedHoleData, setParsedHoleData] = useState(INITIAL_HOLE_DATA);
  const [parseError, setParseError] = useState(null);
  const [activeTab, setActiveTab] = useState('settings');
  
  const [useTiling, setUseTiling] = useState(false);
  const [printSection, setPrintSection] = useState('all');

  const [printMarginTop, setPrintMarginTop] = useState(0);
  const [printMarginLeft, setPrintMarginLeft] = useState(0);
  const [printMarginRight, setPrintMarginRight] = useState(0);
  const [printMarginBottom, setPrintMarginBottom] = useState(0);

  const [previewMode, setPreviewMode] = useState('fit'); // 'fit' of 'actual'

  const printRef = useRef(null);

  useEffect(() => {
    try {
      const data = JSON.parse(holeDataInput);
      setParsedHoleData(data);
      setParseError(null);
    } catch (e) {
      setParseError("Ongeldige JSON structuur");
    }
  }, [holeDataInput]);

  const toggleUnit = () => {
    const newUnit = unit === 'inch' ? 'mm' : 'inch';
    const factor = newUnit === 'mm' ? INCH_TO_MM : MM_TO_INCH;
    setPlateWidth(round(safeFloat(plateWidth) * factor));
    setPlateHeight(round(safeFloat(plateHeight) * factor));
    setOffsetX(round(safeFloat(offsetX) * factor, 3));
    setOffsetY(round(safeFloat(offsetY) * factor, 3));
    setSpacing(round(safeFloat(spacing) * factor, 3)); // Update spacing unit
    setUnit(newUnit);
  };

  const handlePresetChange = (type) => {
    setPlateType(type);
    const preset = PRESETS[type];
    if (unit === 'inch') {
      setPlateWidth(preset.width);
      setPlateHeight(preset.height);
    } else {
      setPlateWidth(round(preset.width * INCH_TO_MM));
      setPlateHeight(round(preset.height * INCH_TO_MM));
    }
  };

  const widthVal = safeFloat(plateWidth);
  const heightVal = safeFloat(plateHeight);
  const widthInInches = unit === 'inch' ? widthVal : widthVal * MM_TO_INCH;
  const heightInInches = unit === 'inch' ? heightVal : heightVal * MM_TO_INCH;
  
  const offsetXVal = safeFloat(offsetX);
  const offsetYVal = safeFloat(offsetY);
  const offsetXInInches = unit === 'inch' ? offsetXVal : offsetXVal * MM_TO_INCH;
  const offsetYInInches = unit === 'inch' ? offsetYVal : offsetYVal * MM_TO_INCH;
  
  const spacingVal = safeFloat(spacing);
  const spacingInInches = unit === 'inch' ? spacingVal : spacingVal * MM_TO_INCH;

  const calculatePositions = () => {
    const limit = typeof charLimit === 'number' ? charLimit : 8; 
    const safeText = text.toUpperCase().slice(0, limit); 
    const charCount = safeText.length;
    if (charCount === 0) return { startX: 0, startY: 0, totalWidth: 0, safeText: "", isTooWide: false };
    
    // Bereken totale breedte tekst met dynamische spacing
    const totalTextWidth = (charCount * CHAR_SPECS.width) + (Math.max(0, charCount - 1) * spacingInInches);
    
    const isTooWide = totalTextWidth > widthInInches;

    let startX = 0;
    if (alignH === 'center') startX = (widthInInches - totalTextWidth) / 2;
    if (alignH === 'right') startX = widthInInches - totalTextWidth - 0.5; 
    if (alignH === 'left') startX = 0.5;
    startX += parseFloat(offsetXInInches);
    let startY = 0;
    if (alignV === 'center') startY = (heightInInches - CHAR_SPECS.height) / 2;
    if (alignV === 'bottom') startY = heightInInches - CHAR_SPECS.height - 0.5;
    if (alignV === 'top') startY = 0.5;
    startY += parseFloat(offsetYInInches);
    return { startX, startY, totalTextWidth, safeText, isTooWide };
  };

  const { startX, startY, totalTextWidth, safeText, isTooWide } = calculatePositions();

  const handlePrint = (section = 'all') => {
    setPrintSection(section);
    setTimeout(() => {
        window.print();
        setTimeout(() => setPrintSection('all'), 500);
    }, 100);
  };

  const canvasHeightInInches = heightInInches + 1.5;
  const widthInMM = widthInInches * 25.4;
  const heightInMM = heightInInches * 25.4;
  const isTooWideForA4 = widthInMM > 210;
  const isTooTallForA4 = heightInMM > 297;
  
  const tiledWidthInInches = (widthInInches / 2) + 0.5;

  const RenderContent = ({ viewBox, customWidth }) => {
    const physicalWidthInches = customWidth || (useTiling ? tiledWidthInInches : widthInInches);
    const physicalWidthMM = physicalWidthInches * 25.4;
    const physicalHeightMM = canvasHeightInInches * 25.4;

    return (
      <svg 
        width={`${physicalWidthMM}mm`} 
        height={`${physicalHeightMM}mm`} 
        viewBox={viewBox} 
        xmlns="http://www.w3.org/2000/svg"
        className={`shadow-sm ${previewMode === 'fit' ? 'w-full h-auto' : ''}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <rect x="0" y="0" width={widthInInches} height={heightInInches} fill="none" stroke="black" strokeWidth="0.02" />
        
        {isTooWide && (
             <rect x="0" y="0" width={widthInInches} height={heightInInches} fill="none" stroke="red" strokeWidth="0.1" strokeDasharray="0.2" opacity="0.5" />
        )}

        <line x1={widthInInches/2} y1={0.2} x2={widthInInches/2} y2={heightInInches - 0.2} stroke="#000" strokeWidth="0.01" strokeDasharray="0.2" />
        <line x1={0.2} y1={heightInInches/2} x2={widthInInches - 0.2} y2={heightInInches/2} stroke="#ddd" strokeWidth="0.01" strokeDasharray="0.1" />

        <g transform={`translate(0.5, ${heightInInches + 0.5})`}>
          <text x="0" y="-0.2" fontSize="0.15" fill="black" fontFamily="sans-serif">Printer Kalibratie (10 cm):</text>
          <line x1="0" y1="0" x2="3.93701" y2="0" stroke="black" strokeWidth="0.02" />
          {[...Array(11)].map((_, i) => {
              const xPos = i * 0.393701;
              const isMain = i === 0 || i === 5 || i === 10;
              return (
                  <line 
                      key={i}
                      x1={xPos} 
                      y1={isMain ? -0.15 : -0.08} 
                      x2={xPos} 
                      y2={isMain ? 0.15 : 0.08} 
                      stroke="black" 
                      strokeWidth={0.02} 
                  />
              );
          })}
          <text x="3.93701" y="0.3" fontSize="0.12" textAnchor="middle">10 cm</text>
        </g>

        {safeText.split('').map((char, index) => {
          // Gebruik dynamische spacingInInches
          const charX = startX + (index * (CHAR_SPECS.width + spacingInInches));
          const charY = startY;
          const charData = parsedHoleData[char];
          let holes = [];
          if (charData) {
            if (Array.isArray(charData)) {
                holes = charData;
            } else if (charData.pins) {
                holes = charData.pins.map(p => ({
                  x: Math.abs(p.x) / 25.4,
                  y: (65.0875 + p.y) / 25.4,
                  diameter: p.diameter
                }));
            }
          }
          return (
            <g key={index} transform={`translate(${charX}, ${charY})`}>
              <rect x="0" y="0" width={CHAR_SPECS.width} height={CHAR_SPECS.height} fill="none" stroke="#e5e7eb" strokeWidth="0.01" />
              <text x={CHAR_SPECS.width/2} y={CHAR_SPECS.height/2} fontSize="1" textAnchor="middle" fill="#f3f4f6" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>{char}</text>
              {holes.length > 0 ? (
                holes.map((hole, hIdx) => {
                  const radius = hole.diameter ? ((hole.diameter / 2) / 25.4) : 0.06;
                  return (
                    <g key={hIdx} transform={`translate(${hole.x}, ${hole.y})`}>
                      <circle cx="0" cy="0" r={radius} fill="none" stroke="black" strokeWidth="0.01" />
                      <line x1={`-${radius * 1.5}`} y1="0" x2={`${radius * 1.5}`} y2="0" stroke="black" strokeWidth="0.005" />
                      <line x1="0" y1={`-${radius * 1.5}`} x2="0" y2={`${radius * 1.5}`} stroke="black" strokeWidth="0.005" />
                    </g>
                  );
                })
              ) : (
                <g>
                  <line x1="0" y1="0" x2={CHAR_SPECS.width} y2={CHAR_SPECS.height} stroke="red" strokeWidth="0.01" opacity="0.3" />
                  <line x1={CHAR_SPECS.width} y1="0" x2="0" y2={CHAR_SPECS.height} stroke="red" strokeWidth="0.01" opacity="0.3" />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
      
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kenteken Boorsjabloon</h1>
          <p className="text-sm text-gray-500">Genereer 1:1 sjablonen voor montagegaten</p>
        </div>
        <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50">
                <input 
                    type="checkbox" 
                    checked={useTiling} 
                    onChange={(e) => setUseTiling(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Scissors size={16} />
                    <span>Verdeel over 2 paginas (A4)</span>
                </div>
            </label>

            {!useTiling ? (
                 <button 
                    onClick={() => handlePrint('all')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
                >
                    <Printer size={20} />
                    Print Sjabloon
                </button>
            ) : (
                <div className="flex gap-2">
                    <button 
                        onClick={() => handlePrint('left')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm"
                    >
                        <Printer size={16} />
                        Print Links
                    </button>
                    <button 
                        onClick={() => handlePrint('right')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm"
                    >
                        <Printer size={16} />
                        Print Rechts
                    </button>
                </div>
            )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 print:block print:w-full print:max-w-none">
        <div className="lg:col-span-1 space-y-4 print:hidden">
          <div className="flex rounded-lg bg-white shadow-sm p-1">
            <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2 text-sm font-medium rounded-md flex justify-center items-center gap-2 ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
              <Settings size={16} /> Instellingen
            </button>
            <button onClick={() => setActiveTab('data')} className={`flex-1 py-2 text-sm font-medium rounded-md flex justify-center items-center gap-2 ${activeTab === 'data' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
              <Database size={16} /> Data Editor
            </button>
          </div>

          {activeTab === 'settings' ? (
            <>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold flex items-center gap-2"><Move size={18} /> Afmetingen</h3>
                  <button onClick={toggleUnit} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1 font-medium text-gray-600 transition-colors">
                    <ArrowRightLeft size={12} /> {unit.toUpperCase()}
                  </button>
                </div>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => handlePresetChange("US")} className={`flex-1 py-1 px-2 text-xs border rounded ${plateType === "US" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-gray-600"}`}>US (12x6")</button>
                  <button onClick={() => handlePresetChange("NL")} className={`flex-1 py-1 px-2 text-xs border rounded ${plateType === "NL" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-gray-600"}`}>NL (EU)</button>
                  <button onClick={() => setPlateType("CUSTOM")} className={`flex-1 py-1 px-2 text-xs border rounded ${plateType === "CUSTOM" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-gray-600"}`}>Custom</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Breedte ({unit})</label>
                    <input 
                      type="number" 
                      step={unit === 'mm' ? "1" : "0.1"} 
                      value={plateWidth} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlateWidth(val === '' ? '' : parseFloat(val)); 
                        setPlateType("CUSTOM");
                      }} 
                      className="w-full border rounded p-2 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Hoogte ({unit})</label>
                    <input 
                      type="number" 
                      step={unit === 'mm' ? "1" : "0.1"} 
                      value={plateHeight} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlateHeight(val === '' ? '' : parseFloat(val)); 
                        setPlateType("CUSTOM");
                      }} 
                      className="w-full border rounded p-2 text-sm" 
                    />
                  </div>
                </div>

                {(isTooWideForA4 || isTooTallForA4) && (
                  <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded text-xs flex gap-2 items-start">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>Let op: Deze plaat ({Math.round(widthInMM)}x{Math.round(heightInMM)}mm) past mogelijk niet op standaard A4 papier (210x297mm). Gebruik "Verdeel over 2 pagina's".</span>
                  </div>
                )}
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <label className="block font-semibold">Kenteken Tekst</label>
                    {isTooWide && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold flex items-center gap-1">
                            <AlertTriangle size={12} /> Te Breed!
                        </span>
                    )}
                </div>
                
                {/* Dynamische Input voor Aantal Karakters & Spacing */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Type size={12}/> Aantal Karakters</label>
                        <input 
                            type="number" 
                            min="1" max="20" 
                            value={charLimit} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setCharLimit(val === '' ? '' : parseInt(val));
                            }}
                            className="w-full border rounded p-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><ArrowLeftRight size={12}/> Tussenruimte ({unit})</label>
                        <input 
                          type="number" 
                          step={unit === 'mm' ? "0.1" : "0.01"} 
                          value={spacing} 
                          onChange={(e) => setSpacing(safeFloat(e.target.value))} 
                          className="w-full border rounded p-2 text-sm" 
                        />
                    </div>
                </div>

                <input 
                    type="text" 
                    value={text} 
                    maxLength={typeof charLimit === 'number' ? charLimit : 20} 
                    onChange={(e) => setText(e.target.value)} 
                    className={`w-full border-2 rounded-lg p-3 text-xl font-mono uppercase tracking-widest outline-none transition-colors ${isTooWide ? 'border-red-400 bg-red-50' : 'border-blue-200 focus:border-blue-500'}`} 
                    placeholder="KENTEKEN" 
                />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>{text.length}/{typeof charLimit === 'number' ? charLimit : '-'} tekens</span>
                    {isTooWide && <span className="text-red-500 font-bold">Tekst past niet op de plaat!</span>}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><AlignJustify size={18} /> Positie & Uitlijning</h3>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Horizontaal</label>
                  <div className="flex bg-gray-100 p-1 rounded mb-2">
                    <button onClick={() => setAlignH('left')} className={`flex-1 p-1 rounded ${alignH === 'left' ? 'bg-white shadow' : ''}`}><AlignLeft size={16} className="mx-auto"/></button>
                    <button onClick={() => setAlignH('center')} className={`flex-1 p-1 rounded ${alignH === 'center' ? 'bg-white shadow' : ''}`}><AlignCenter size={16} className="mx-auto"/></button>
                    <button onClick={() => setAlignH('right')} className={`flex-1 p-1 rounded ${alignH === 'right' ? 'bg-white shadow' : ''}`}><AlignRight size={16} className="mx-auto"/></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-16">Offset ({unit}):</span>
                    <input type="range" min={unit === 'mm' ? -75 : -3} max={unit === 'mm' ? 75 : 3} step={unit === 'mm' ? 1 : 0.125} value={offsetX} onChange={(e) => setOffsetX(e.target.value)} className="flex-1" />
                    <span className="text-xs w-10 text-right">{offsetX}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Verticaal</label>
                  <div className="flex bg-gray-100 p-1 rounded mb-2">
                    <button onClick={() => setAlignV('top')} className={`flex-1 p-1 rounded ${alignV === 'top' ? 'bg-white shadow' : 'text-gray-400'}`}>Top</button>
                    <button onClick={() => setAlignV('center')} className={`flex-1 p-1 rounded ${alignV === 'center' ? 'bg-white shadow' : ''}`}>Mid</button>
                    <button onClick={() => setAlignV('bottom')} className={`flex-1 p-1 rounded ${alignV === 'bottom' ? 'bg-white shadow' : 'text-gray-400'}`}>Bot</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-16">Offset ({unit}):</span>
                    <input type="range" min={unit === 'mm' ? -75 : -3} max={unit === 'mm' ? 75 : 3} step={unit === 'mm' ? 1 : 0.125} value={offsetY} onChange={(e) => setOffsetY(e.target.value)} className="flex-1" />
                    <span className="text-xs w-10 text-right">{offsetY}</span>
                  </div>
                </div>
              </div>

               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Ruler size={18} /> Printer Marges & Correctie</h3>
                <p className="text-xs text-gray-500 mb-3">Verschuif de print op het papier door marges in te stellen (mm).</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Boven (mm)</label>
                    <input 
                      type="number" 
                      step="1" 
                      value={printMarginTop} 
                      onChange={(e) => setPrintMarginTop(safeFloat(e.target.value))} 
                      className="w-full border rounded p-2 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Rechts (mm)</label>
                    <input 
                      type="number" 
                      step="1" 
                      value={printMarginRight} 
                      onChange={(e) => setPrintMarginRight(safeFloat(e.target.value))} 
                      className="w-full border rounded p-2 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Onder (mm)</label>
                    <input 
                      type="number" 
                      step="1" 
                      value={printMarginBottom} 
                      onChange={(e) => setPrintMarginBottom(safeFloat(e.target.value))} 
                      className="w-full border rounded p-2 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Links (mm)</label>
                    <input 
                      type="number" 
                      step="1" 
                      value={printMarginLeft} 
                      onChange={(e) => setPrintMarginLeft(safeFloat(e.target.value))} 
                      className="w-full border rounded p-2 text-sm" 
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-full">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-600"><Database size={18} /> JSON Data Input</h3>
              <p className="text-xs text-gray-500 mb-4">Plak hier je geëxporteerde coördinaten. Formaat: Fusion360 Export (mm, negatieve coördinaten).</p>
              <textarea className={`w-full h-96 p-2 text-xs font-mono border rounded ${parseError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} value={holeDataInput} onChange={(e) => setHoleDataInput(e.target.value)} />
              {parseError && <div className="text-red-600 text-xs mt-2 font-bold">{parseError}</div>}
              <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded"><strong>Huidige Karakters beschikbaar:</strong><br/>{Object.keys(parsedHoleData).join(", ")}</div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-8 flex flex-col items-center justify-center overflow-auto min-h-[500px]">
          <div className="print:hidden mb-4 flex flex-col items-center">
             <span className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-2">Live Preview</span>
             <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setPreviewMode('fit')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${previewMode === 'fit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Maximize size={14} /> Passend
                </button>
                <button 
                  onClick={() => setPreviewMode('actual')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${previewMode === 'actual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <ZoomIn size={14} /> Ware Grootte
                </button>
             </div>
          </div>

          <div className="mb-4 p-3 bg-blue-50 text-blue-900 text-xs rounded-md print:hidden flex items-start gap-2 max-w-lg mx-auto border border-blue-100">
             <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
             <div>
               <strong>Print Tip:</strong> 
               <ul className="list-disc ml-4 mt-1 space-y-1">
                 <li>Zet <u>"Schaal aanpassen" (Fit to page)</u> <strong>UIT</strong> (schaal 100%).</li>
                 <li>Gebruik <strong>Liggend (Landscape)</strong> oriëntatie voor A4 papier.</li>
                 <li>Zorg dat marges op <strong>'Geen'</strong> of <strong>'Minimaal'</strong> staan.</li>
               </ul>
             </div>
          </div>

          {isTooWide && (
             <div className="mb-4 p-3 bg-red-50 text-red-900 text-xs rounded-md print:hidden border border-red-200 w-full max-w-lg text-center font-bold">
                 LET OP: De tekst is te breed voor de gekozen plaat!
             </div>
          )}

          <div id="print-mount" ref={printRef} className="border-2 border-dashed border-gray-300 bg-white relative">
            {useTiling ? (
                <>
                    {(printSection === 'all' || printSection === 'left') && (
                        <div 
                            className="print-page mb-8 border-b-2 border-blue-100 pb-4 print:border-none print:mb-0 print:pb-0"
                            style={{ 
                                pageBreakAfter: (printSection === 'all') ? 'always' : 'auto',
                                breakAfter: (printSection === 'all') ? 'page' : 'auto'
                            }}
                        >
                            <div className="text-xs text-blue-500 font-bold mb-2 print:hidden text-center">Pagina 1 (Links)</div>
                            <RenderContent 
                                viewBox={`0 0 ${(widthInInches / 2) + 0.5} ${canvasHeightInInches}`}
                                customWidth={tiledWidthInInches}
                            />
                        </div>
                    )}
                    
                    {(printSection === 'all' || printSection === 'right') && (
                        <div className="print-page">
                            <div className="text-xs text-blue-500 font-bold mb-2 print:hidden text-center">Pagina 2 (Rechts)</div>
                            <RenderContent 
                                viewBox={`${(widthInInches / 2) - 0.5} 0 ${(widthInInches / 2) + 0.5} ${canvasHeightInInches}`}
                                customWidth={tiledWidthInInches}
                            />
                        </div>
                    )}
                </>
            ) : (
                <RenderContent viewBox={`0 0 ${widthInInches} ${canvasHeightInInches}`} />
            )}
          </div>
          <div className="mt-4 text-xs text-gray-400 print:hidden flex items-center gap-2"><Info size={14}/><span>Rode kruizen geven aan dat de data voor dat karakter ontbreekt in de JSON.</span></div>
        </div>
      </div>

      <style>{`
        @media print {
          body, html {
            margin: 0 !important;
            padding: 0 !important;
          }

          #root {
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
          }

          svg {
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;  
            height: auto !important; 
            max-width: none !important;
          }

          * {
            zoom: 1 !important;
            box-shadow: none !important;
            text-shadow: none !important;
            -webkit-print-color-adjust: exact;
          }

          @page {
            margin: ${printMarginTop}mm ${printMarginRight}mm ${printMarginBottom}mm ${printMarginLeft}mm !important; 
          }

          body * {
            visibility: hidden;
          }
          
          #print-mount, #print-mount * {
            visibility: visible;
          }
          
          #print-mount {
            position: absolute;
            top: 0;
            left: 0;
            width: 100% !important; 
            height: auto !important;
            margin: 0;
            padding: 0;
            overflow: visible !important;
          }
          
          .print-page {
            position: relative;
            width: 100%;
            height: auto; 
            overflow: visible; 
            display: block;   
          }

          .page-break {
            break-after: page;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}