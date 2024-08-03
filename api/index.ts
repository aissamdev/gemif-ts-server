import express, { json } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { SUBJECTS } from '../constants/subjects';
import cors from 'cors';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(json());
app.use(cors({ origin: 'http://localhost:5173' }));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'abc123';

// User Endpoints
const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.post('/api/login', async (req, res) => {
    const userToLogin = req.body;
    const user = await prisma.user.findUnique({ where: { email: userToLogin.email } });

    if (!user) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(userToLogin.password, user.password);
    if (!validPassword) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ id: user.id, name: user.name, year: user.year, email: user.email, token });
});

app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id: id } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ name: user.name, year: user.year, email: user.email });
});

app.post('/api/users', async (req, res) => {
    const userToPost = req.body;

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(userToPost.password, 10);

    const user = await prisma.user.create({
        data: {
            name: userToPost.name,
            email: userToPost.email,
            year: userToPost.year,
            password: hashedPassword,
        },
    });

    const date = new Date();
    const quadri = date.getMonth() >= 1 ? 1 : 0;

    const yearIndex = Number(user.year ?? '1') - 1;
    const subjects = SUBJECTS[yearIndex][quadri];

    const initialBoards: Prisma.BoardCreateManyInput[] = subjects.map((subject) => ({
        userId: user.id,
        name: subject,
    }));

    await prisma.board.createMany({ data: initialBoards });

    res.json({ id: user.id, name: user.name, year: user.year, email: user.email });
});

app.patch('/api/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, email, year, password } = req.body;

    // Hash the password if it is provided
    let updatedData: any = { name, email, year };
    if (password) {
        updatedData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
        where: { id: id },
        data: updatedData,
    });
    res.json({ id: user.id, name: user.name, year: user.year, email: user.email });
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.delete({
        where: { id: id },
    });
    res.json(user);
});

// Board Endpoints
app.get('/api/boards', async (req, res) => {
    const boards = await prisma.board.findMany();
    res.json(boards);
});

app.post('/api/boards', async (req, res) => {
    const boardToPost = req.body;
    const board = await prisma.board.create({
        data: { name: boardToPost.name, userId: boardToPost.userId },
    });
    res.json(board);
});

app.patch('/api/boards/:id', async (req, res) => {
    const { id } = req.params;
    const boardToPatch = req.body;
    const board = await prisma.board.update({
        where: { id: id },
        data: { name: boardToPatch.name, userId: boardToPatch.userId },
    });
    res.json(board);
});

app.delete('/api/boards/:id', async (req, res) => {
    const { id } = req.params;
    const board = await prisma.board.delete({
        where: { id: id },
    });
    res.json(board);
});

// Card Endpoints
app.get('/api/cards', async (req, res) => {
    const cards = await prisma.card.findMany();
    res.json(cards);
});

app.post('/api/cards', async (req, res) => {
    const cardToPost: Prisma.CardCreateInput = req.body;
    const card = await prisma.card.create({
        data: { ...cardToPost },
    });
    res.json(card);
});

app.patch('/api/cards/:id', async (req, res) => {
    const { id } = req.params;
    const cardToPatch = req.body;
    const card = await prisma.card.update({
        where: { id: id },
        data: { ...cardToPatch },
    });
    res.json(card);
});

app.delete('/api/cards/:id', async (req, res) => {
    const { id } = req.params;
    const card = await prisma.card.delete({
        where: { id: id },
    });
    res.json(card);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
