'use client';

interface IshikawaProps {
  efecto: string;
  causas: IshikawaCategoria[];
}

interface IshikawaCategoria {
  nombre: string;
  factores: string[];
}

const CATEGORY_COLORS = [
  { fill: '#EFF6FF', stroke: '#3B82F6', text: '#1E40AF' },
  { fill: '#FEF2F2', stroke: '#EF4444', text: '#991B1B' },
  { fill: '#F0FDF4', stroke: '#22C55E', text: '#166534' },
  { fill: '#FFFBEB', stroke: '#F59E0B', text: '#92400E' },
  { fill: '#F5F3FF', stroke: '#8B5CF6', text: '#5B21B6' },
  { fill: '#FCE7F3', stroke: '#EC4899', text: '#9D174D' },
  { fill: '#F1F5F9', stroke: '#64748B', text: '#334155' },
  { fill: '#ECFEFF', stroke: '#06B6D4', text: '#155E75' },
];

export default function IshikawaDiagram({ efecto, causas }: IshikawaProps) {
  if (causas.length === 0) return null;

  const W = 900;
  const H = 480;
  const SPINE_Y = H / 2;
  const SPINE_START = 80;
  const SPINE_END = W - 100;
  const SPINE_LEN = SPINE_END - SPINE_START;
  const GAP = SPINE_LEN / causas.length;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-4xl" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
          </marker>
        </defs>

        {/* Spine (horizontal line) */}
        <line x1={SPINE_START} y1={SPINE_Y} x2={SPINE_END} y2={SPINE_Y} stroke="#374151" strokeWidth="2.5" markerEnd="url(#arrowhead)" />

        {/* Effect box (head) */}
        <rect x={SPINE_END - 8} y={SPINE_Y - 28} width={90} height={56} rx="6" fill="#FEF2F2" stroke="#DC2626" strokeWidth="2" />
        <text x={SPINE_END - 8 + 45} y={SPINE_Y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="bold" fill="#991B1B">
          {efecto}
        </text>

        {/* Categories (bones) */}
        {causas.map((cat, ci) => {
          const cx = SPINE_START + GAP * ci + GAP / 2;
          const side = ci % 2 === 0 ? -1 : 1;
          const boneEndY = SPINE_Y + side * 80;
          const color = CATEGORY_COLORS[ci % CATEGORY_COLORS.length];
          const labelBoxH = Math.max(36, cat.factores.length * 18 + 14);
          const labelBoxY = boneEndY > SPINE_Y ? SPINE_Y + 12 : SPINE_Y - 12 - labelBoxH;

          return (
            <g key={cat.nombre}>
              {/* Main bone line */}
              <line x1={cx} y1={SPINE_Y} x2={cx} y2={boneEndY} stroke={color.stroke} strokeWidth="2" />

              {/* Category label box */}
              <rect
                x={cx - 50}
                y={labelBoxY}
                width={100}
                height={labelBoxH}
                rx="4"
                fill={color.fill}
                stroke={color.stroke}
                strokeWidth="1.5"
              />
              <text x={cx} y={labelBoxY + 14} textAnchor="middle" fontSize="10" fontWeight="bold" fill={color.text}>
                {cat.nombre}
              </text>

              {/* Sub-causes (small lines off the bone) */}
              {cat.factores.map((f, fi) => {
                const fy = boneEndY > SPINE_Y
                  ? SPINE_Y + 30 + fi * 22
                  : SPINE_Y - 30 - fi * 22;
                if (fy < labelBoxY || fy > labelBoxY + labelBoxH) {
                  return (
                    <g key={fi}>
                      <line x1={cx} y1={fy} x2={cx + 35} y2={fy} stroke={color.stroke} strokeWidth="1" opacity="0.7" />
                      <text x={cx + 38} y={fy + 3} fontSize="8" fill="#4B5563">
                        {f}
                      </text>
                    </g>
                  );
                }
                return null;
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
