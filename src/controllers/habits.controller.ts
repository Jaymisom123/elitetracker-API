import dayjs from 'dayjs';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

import { habitModel } from '../models/habit.model';
import { createHabitSchema } from '../schemas/schema';
import { getUserId } from '../utils/auth-helper';
import { buildValidationErrorMessage } from '../utils/build-validation-error-message-util';

export class HabitsController {
  create = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
      }

      const validateData = createHabitSchema.parse(req.body);

      const findHabit = await habitModel.model.findOne(
        { name: validateData.name, userId },
        null,
        { collation: { locale: 'en', strength: 2 } }
      );
      if (findHabit) {
        return res.status(400).json({
          success: false,
          error: {
            message: '❗ Habit already exists',
          },
        });
      }

      const newHabit = await habitModel.model.create({
        name: validateData.name,
        completedDates: [],
        userId,
        frequency: validateData.frequency,
        startDate: validateData.startDate,
        description: validateData.description,
      });

      return res.status(201).json({
        success: true,
        data: {
          name: newHabit.name,
          completedDates: newHabit.completedDates,
          _id: newHabit._id,
          userId: newHabit.userId,
          createdAt: newHabit.createdAt,
          updatedAt: newHabit.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          success: false,
          error: {
            issues: buildValidationErrorMessage(error.issues),
            name: 'zodError',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          name: 'internalError',
        },
      });
    }
  };
  index = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const habits = await habitModel.model.find({ userId }).sort({
      name: 1,
    });
    return res.json(habits);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const deletedHabit = await habitModel.model.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!deletedHabit) {
      return res
        .status(404)
        .json({ error: 'Habit not found or not authorized' });
    }

    return res.status(204).json();
  };

  toggle = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const habit = await habitModel.model.findOne({
      _id: id,
      userId,
    });
    if (!habit) {
      return res
        .status(404)
        .json({ error: 'Habit not found or not authorized' });
    }

    const today = dayjs().startOf('day');

    const isCompletedToday = habit.completedDates.some((date) => {
      if (date instanceof Date) {
        return today.isSame(date, 'day');
      } else {
        const dateAsString = date.toString();
        const dateAsDayjs = dayjs(dateAsString);
        return today.isSame(dateAsDayjs, 'day');
      }
    });

    if (isCompletedToday) {
      await habitModel.model.updateOne(
        { _id: id },
        { $pull: { completedDates: today.toDate() } }
      );
    } else {
      await habitModel.model.updateOne(
        { _id: id },
        { $push: { completedDates: today.toDate() } }
      );
    }

    const updatedHabit = await habitModel.model.findById(id);

    return res.status(200).json({
      success: true,
      data: {
        name: updatedHabit?.name,
        completedDates: updatedHabit?.completedDates,
        _id: updatedHabit?._id,
        createdAt: updatedHabit?.createdAt,
        updatedAt: updatedHabit?.updatedAt,
      },
    });
  };

  metrics = async (req: Request, res: Response) => {
    const schema = z.object({
      id: z.string(),
      date: z.coerce.date(),
    });
    const validateData = schema.safeParse({ ...req.params, ...req.query });

    if (!validateData.success) {
      const errors = buildValidationErrorMessage(validateData.error.issues);
      return res.status(400).json({ error: 'Invalid data' });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const habit = await habitModel.model.findOne({
      _id: validateData.data.id,
      userId,
    });
    if (!habit) {
      return res.status(404).json({
        error: 'Habit not found or not authorized',
      });
    }

    const dateFrom = dayjs(validateData.data.date).startOf('month');
    const dateTo = dayjs(validateData.data.date).endOf('month');

    const [habitMetrics] = await habitModel.model
      .aggregate()
      .match({
        _id: new mongoose.Types.ObjectId(validateData.data.id),
        userId,
      })
      .project({
        _id: 1,
        name: 1,
        completedDates: {
          $filter: {
            input: '$completedDates',
            as: 'completedDate',
            cond: {
              $and: [
                { $gte: ['$$completedDate', dateFrom.toDate()] },
                { $lte: ['$$completedDate', dateTo.toDate()] },
              ],
            },
          },
        },
      });
    if (!habitMetrics) {
      return res.status(404).json({
        success: false,
        error: {
          message: '❗ Habit not found or not authorized',
        },
      });
    }

    return res.status(200).json(habitMetrics);
  };
}
