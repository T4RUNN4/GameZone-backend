import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const PORT: number = Number(process.env.PORT!);
const URI: string = process.env.MONGO_URI!;

const client = new MongoClient(URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("game-zone");
    const gamesCollection = db.collection("games");
    const slotCollection = db.collection("slots");

    app.get("/", (req: Request, res: Response) => {
      res.send("App is running");
    });

    app.get("/games", async (req: Request, res: Response) => {
      const games = await gamesCollection.find().toArray();
      res.json(games);
    });

    app.get(
      "/games/:id",
      async (req: Request<{ id: string }>, res: Response) => {
        const { id } = req.params;

        const game = await gamesCollection.findOne({
          _id: new ObjectId(id),
        });

        res.json(game);
      },
    );

    app.post("/add-games", async (req: Request, res: Response) => {
      const data = req.body;
      const ret = await gamesCollection.insertOne(data);

      res.json(ret);
    });

    app.delete(
      "/games/delete/:id",
      async (req: Request<{ id: string }>, res: Response) => {
        const { id } = req.params;

        const result = await gamesCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 1) {
          return res.json({
            success: true,
            message: "Game deleted successfully",
          });
        }
      },
    );

    app.get("/slot/", async (req: Request<{ id: string }>, res: Response) => {
      const slotsDetails = await slotCollection.find().toArray();
      res.json(slotsDetails);
    });

    app.get(
      "/slot/:id",
      async (req: Request<{ id: string }>, res: Response) => {
        const { id } = req.params;
        const slotsDetails = await slotCollection
          .find({
            userId: id,
          })
          .toArray();

        res.json(slotsDetails);
      },
    );

    app.post("/slot/book", async (req: Request, res: Response) => {
      const slotDetails = req.body;
      const ret = await slotCollection.insertOne(slotDetails);

      res.json(ret);
    });

    app.patch(
      "/slot/update-status/:id",
      async (
        req: Request<{ id: string }, {}, { status: string }>,
        res: Response,
      ) => {
        const { id } = req.params;
        const { status } = req.body;

        const result = await slotCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } },
        );

        res.send(result);
      },
    );

    if (process.env.NODE_ENV !== "production") {
      app.listen(PORT, () => {
        console.log(`Server running on ${PORT}`);
      });
    }

  } finally {
  }
}

export default app;
run().catch(console.dir);
