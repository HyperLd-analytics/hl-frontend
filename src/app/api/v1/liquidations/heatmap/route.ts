import { NextResponse } from 'next/server';

export async function GET() {
  // Mock liquidation heatmap data
  return NextResponse.json({
    points: [
      { priceBand: '45000-46000', intensity: 12.5 },
      { priceBand: '46000-47000', intensity: 8.3 },
      { priceBand: '47000-48000', intensity: 15.7 },
      { priceBand: '48000-49000', intensity: 22.4 },
      { priceBand: '49000-50000', intensity: 18.9 },
      { priceBand: '50000-51000', intensity: 25.6 },
      { priceBand: '51000-52000', intensity: 31.2 },
      { priceBand: '52000-53000', intensity: 28.7 },
      { priceBand: '53000-54000', intensity: 19.3 },
      { priceBand: '54000-55000', intensity: 14.8 },
      { priceBand: '55000-56000', intensity: 10.2 },
      { priceBand: '56000-57000', intensity: 7.5 }
    ]
  });
}
