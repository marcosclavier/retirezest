# 🚀 Next Steps - Complete the MVP Setup

## Current Status

✅ **You're 25% done!** The foundation is set. Here's what's been built:

### Completed
- ✅ Next.js 15 project initialized
- ✅ TypeScript configured
- ✅ Tailwind CSS set up
- ✅ Database schema created (Prisma)
- ✅ Authentication utilities built
- ✅ TypeScript types defined
- ✅ Utility functions created
- ✅ Complete documentation created

### In Progress
- 🔄 Installing base npm dependencies

---

## 📋 Step-by-Step Guide to Complete Setup

### Step 1: Wait for Current Installation

The base Next.js dependencies are currently installing. Once complete, you'll see a success message.

**Check status:**
```bash
cd C:\Projects\retirement-app\webapp
# If you see "node_modules" folder with many files, installation is done
```

---

### Step 2: Install Additional Dependencies

#### Option A: Use the Automated Script (Recommended)

**On Windows:**
```bash
cd C:\Projects\retirement-app\webapp
.\install-dependencies.bat
```

**On Mac/Linux:**
```bash
cd C:\Projects\retirement-app\webapp
chmod +x install-dependencies.sh
./install-dependencies.sh
```

#### Option B: Manual Installation

```bash
cd C:\Projects\retirement-app\webapp

# Install Prisma and database tools
npm install prisma @prisma/client

# Install form libraries
npm install react-hook-form @hookform/resolvers zod

# Install authentication libraries
npm install jose bcryptjs
npm install --save-dev @types/bcryptjs

# Install chart and utility libraries
npm install recharts date-fns clsx tailwind-merge
```

---

### Step 3: Set Up the Database

```bash
cd C:\Projects\retirement-app\webapp

# Generate Prisma client
npx prisma generate

# Create the database and run migrations
npx prisma migrate dev --name init
```

This will create a `dev.db` file (your SQLite database).

---

### Step 4: Start the Development Server

```bash
npm run dev
```

Open your browser and navigate to: **http://localhost:3000**

You should see the homepage with "Canadian Retirement Planning App"!

---

### Step 5: View Your Database (Optional)

```bash
npx prisma studio
```

This opens a GUI at **http://localhost:5555** where you can view and edit your database.

---

## 🛠️ What to Build Next

### Phase 1: Authentication Pages (Days 3-5)

Create these files in order:

#### 1. Login Page
Create `app/(auth)/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Don't have an account?{' '}
          <a href="/register" className="text-indigo-600 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
```

#### 2. Register Page
Create `app/(auth)/register/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Register</h2>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
              minLength={8}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
          >
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
```

#### 3. Authentication API Routes

Create `app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken, setSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
    });

    // Create token
    const token = await createToken({
      userId: user.id,
      email: user.email,
    });

    // Set session cookie
    await setSession(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
```

Create `app/api/auth/login/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createToken, setSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create token
    const token = await createToken({
      userId: user.id,
      email: user.email,
    });

    // Set session cookie
    await setSession(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
```

Create `app/api/auth/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}
```

---

## 📚 Documentation Available

You now have comprehensive documentation:

1. **SETUP-GUIDE.md** - Complete setup instructions
2. **mvp-development-plan.md** - 4-6 week MVP plan with detailed tasks
3. **development-plan.md** - Full 10-month enterprise plan
4. **webapp/README.md** - Project-specific README
5. **PROGRESS.md** - Track your progress (this gets updated)
6. **NEXT-STEPS.md** - This file!

---

## 🎯 Development Roadmap

### ✅ Week 1 (25% Complete)
- [x] Project setup
- [x] Database schema
- [x] Authentication utilities
- [ ] Login/Register pages (next)
- [ ] Dashboard layout

### Week 2 (Upcoming)
- [ ] Financial profile forms
- [ ] Income, assets, expenses, debts CRUD
- [ ] Financial summary

### Week 3 (Upcoming)
- [ ] CPP calculator
- [ ] OAS calculator
- [ ] GIS calculator
- [ ] Benefits summary

### Week 4 (Upcoming)
- [ ] Tax calculation engine
- [ ] Retirement projection algorithm
- [ ] Projection results display

### Weeks 5-6 (Upcoming)
- [ ] Dashboard with charts
- [ ] Scenario planning
- [ ] PDF reports
- [ ] Polish & testing

---

## 🧪 Testing Your Progress

After each step, test:

1. **After Step 4 (Start dev server):**
   - Visit http://localhost:3000
   - You should see the homepage

2. **After creating login/register pages:**
   - Visit http://localhost:3000/login
   - Visit http://localhost:3000/register
   - Forms should display

3. **After creating API routes:**
   - Try registering a new user
   - Try logging in
   - Check Prisma Studio to see the user in database

---

## 💡 Tips

### Debugging
- Check browser console for errors (F12)
- Check terminal for server errors
- Use `console.log()` liberally

### Database
- Use `npx prisma studio` to view data
- Run `npx prisma migrate reset` to reset database
- Always run `npx prisma generate` after schema changes

### Development
- Server hot-reloads on file changes
- Hard refresh browser (Ctrl+Shift+R) if styles don't update
- Kill and restart server if strange errors occur

---

## 🆘 Common Issues

### "Module not found"
```bash
npm install
npx prisma generate
```

### "Port 3000 already in use"
```bash
npx kill-port 3000
# or use different port
npm run dev -- -p 3001
```

### "Database locked"
Close Prisma Studio, then:
```bash
npx prisma migrate reset
```

### "Prisma client not generated"
```bash
npx prisma generate
```

---

## 📞 Need Help?

1. Check the error message carefully
2. Review the setup guide (`SETUP-GUIDE.md`)
3. Check the MVP development plan (`mvp-development-plan.md`)
4. Review Next.js documentation: https://nextjs.org/docs
5. Review Prisma documentation: https://www.prisma.io/docs

---

## 🎉 You're Ready!

You have everything you need:
- ✅ Complete project structure
- ✅ Database schema
- ✅ Authentication system (utilities)
- ✅ TypeScript types
- ✅ Comprehensive documentation

**Next:** Complete the installation steps above and start building!

**Goal:** Have a working authentication system by end of Day 5.

---

**Good luck with your development! 🚀**
