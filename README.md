# 🧳 Travel Expense Manager

Welcome to the **Travel Expense Manager** – because who doesn’t love tracking every penny while traveling?  
This project is a full-stack app (React + Node.js/Express + MongoDB) that lets you submit, track, and analyze your travel expenses, so you can feel guilty about that extra coffee in Paris.

---

## 🚀 Features

- **Expense Submission:** Log your travel, accommodation, meals, and “Other” (aka, shopping sprees) expenses.
- **Budget Tracking:** Set a monthly budget and watch yourself go over it in real time.
- **Analytics:** Pie charts and tables to show you exactly where your money went (spoiler: it’s always food).
- **Group Splitting:** Split expenses with friends, because nothing says “fun trip” like arguing over who owes what.
- **Currency Conversion:** Converts your expenses to USD, so you can cry in a single currency.

---

## 🏗️ Project Structure

```
travel-expense-manager/
│
├── travel-expense-manager/        # Frontend (React)
│   └── src/
│       └── Components/
│           └── ExpenseForm.js
│           └── Dashboard.js
│       └── ...
│
├── travel-expense-server/         # Backend (Node.js/Express)
│   ├── models/
│   │   └── User.js
│   │   └── Expense.js
│   ├── routes/
│   │   └── expenseRoutes.js
│   ├── .env.example
│   ├── .gitignore
│   └── server.js
│
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the repo (because you’re not writing this from scratch, right?)
```sh
git clone https://github.com/RudraMudra/travel-expense.git
cd travel-expense
```

### 2. Backend Setup

```sh
cd travel-expense-server
cp .env.example .env   # Or just create .env and fill in your secrets
npm install
npm run dev            # Or npm start if you like living dangerously
```

### 3. Frontend Setup

```sh
cd ../travel-expense-manager
npm install
npm start
```

### 4. Environment Variables

- Copy `.env.example` to `.env` in the backend folder.
- Fill in your actual MongoDB URI, JWT secret, and Exchange Rate API key.
- If you push your real `.env` to GitHub, may the security gods have mercy on your soul.

---

## 📝 API Endpoints (Backend)

- `POST /api/expenses/submit` – Submit an expense (with JWT, please).
- `GET /api/expenses/my` – Get your own expenses.
- `GET /api/expenses/report` – Get a summary report.
- `GET /api/expenses/analytics` – Get analytics (for those who love charts).
- ...and more! Check the code if you’re curious.

---

## 🤦 Common Issues

- **“username is required”**: Your JWT probably doesn’t have a username. Fix your auth logic.
- **CORS errors**: Because the browser hates you. Make sure your backend allows requests from your frontend.
- **MongoDB connection fails**: Did you actually put your URI in `.env`? Or are you just hoping for the best?

---

## 🛡️ Security

- `.env` is in `.gitignore`. If you push it, that’s on you.
- Don’t share your JWT secret. Seriously.

---

## 🙃 Contributing

PRs welcome! Just don’t break anything. Or do, but leave a funny comment.

---

## 📜 License

MIT – because why not.

---

**Happy expense tracking!**  
*(And remember: the real expense is the friends you made along the way.)*
