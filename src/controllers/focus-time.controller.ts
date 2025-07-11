import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { z } from 'zod';

import { FocusTimeModel } from '../models/focus-time-model';
import { getUserId } from '../utils/auth-helper';
import { buildValidationErrorMessage } from '../utils/build-validation-error-message-util';

export class FocusTimeController {
  create = async (req: Request, res: Response) => {
    try {
      const schema = z
        .object({
          timeFrom: z.coerce.date(),
          timeTo: z.coerce.date(),
        })
        .refine((data) => dayjs(data.timeTo).isAfter(dayjs(data.timeFrom)), {
          message: 'A data final deve ser posterior à data inicial',
        })
        .parse(req.body);

      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Autenticação necessária' },
        });
      }

      // Calcular duração em minutos com precisão
      const duration = Math.max(
        0,
        dayjs(schema.timeTo).diff(schema.timeFrom, 'minute')
      );

      const createdFocusTime = await FocusTimeModel.create({
        timeFrom: schema.timeFrom,
        timeTo: schema.timeTo,
        duration, // Duração em minutos
        userId,
      });

      return res.status(201).json({
        success: true,
        data: createdFocusTime,
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: buildValidationErrorMessage(error.issues),
        });
      } else {
        console.error('Erro ao criar tempo de foco:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
        });
      }
    }
  };
  metricsByMonth = async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        date: z.coerce.date(),
      });

      const validateData = schema.safeParse(req.query);

      if (!validateData.success) {
        return res.status(400).json({
          success: false,
          error: buildValidationErrorMessage(validateData.error.issues),
        });
      }

      const { date } = validateData.data;
      const startDate = dayjs(date).startOf('month').toDate();
      const endDate = dayjs(date).endOf('month').toDate();

      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Autenticação necessária' },
        });
      }

      const focusTimeMetrics = await FocusTimeModel.aggregate([
        {
          $match: {
            timeFrom: { $gte: startDate, $lte: endDate },
            userId,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$timeFrom' },
              month: { $month: '$timeFrom' },
              day: { $dayOfMonth: '$timeFrom' },
            },
            totalDuration: { $sum: '$duration' },
            sessionsCount: { $sum: 1 },
            longestSession: { $max: '$duration' },
            shortestSession: { $min: '$duration' },
          },
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
            '_id.day': 1,
          },
        },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
              },
            },
            totalDuration: 1,
            sessionsCount: 1,
            longestSession: 1,
            shortestSession: 1,
          },
        },
      ]);

      // Calcular métricas gerais do mês
      const monthlyMetrics = await FocusTimeModel.aggregate([
        {
          $match: {
            timeFrom: { $gte: startDate, $lte: endDate },
            userId,
          },
        },
        {
          $group: {
            _id: null,
            totalMonthDuration: { $sum: '$duration' },
            totalSessions: { $sum: 1 },
            averageSessionDuration: { $avg: '$duration' },
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        data: {
          dailyMetrics: focusTimeMetrics,
          monthlyMetrics: monthlyMetrics[0] || {
            totalMonthDuration: 0,
            totalSessions: 0,
            averageSessionDuration: 0,
          },
        },
      });
    } catch (error: unknown) {
      console.error('Erro ao buscar métricas de tempo de foco:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  };
  index = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
      }

      const focusTimes = await FocusTimeModel.find({ userId }).sort({
        timeFrom: 1,
      });
      return res.status(200).json({
        success: true,
        data: focusTimes,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  };
}
