import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'docs', 'RetireZest-Quick-Reference-Guide.md');
    const markdownContent = fs.readFileSync(filePath, 'utf8');

    return NextResponse.json({ content: markdownContent });
  } catch (error) {
    console.error('Error reading guide:', error);
    return NextResponse.json(
      { error: 'Failed to load guide' },
      { status: 500 }
    );
  }
}
