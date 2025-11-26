import { Router, Request, Response } from "express";
import { Event } from "../models/event"; 

const router = Router();

router.post("/addEvent", async (req: Request, res: Response) => {
  try {
    const newEvent = new Event({
      ...req.body,
    });

    const savedEvent = await newEvent.save();
    res.status(200).json(savedEvent);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to create event" });
  }
});

export default router;