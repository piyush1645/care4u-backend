import { z } from "zod";

export const PaymentTypeSchema = z.enum([
  "CARD",
  "UPI",
  "NET_BANKING",
  "CASH",
  "ADVANCE",
]);

export const PaymentStatusSchema = z.enum([
  "SUCCESS",
  "FAILED",
  "PENDING",
]);

export const PaymentDetailsSchema = z.object({
  transactionId: z.string().min(1).optional(),
  cardNumber: z.string().min(1).optional(),
  upiId: z.string().min(1).optional(),
});

export const CreatePaymentSchema = z
  .object({
    amount: z.number().positive(),
    type: PaymentTypeSchema,
    status: PaymentStatusSchema,
    paymentDetails: PaymentDetailsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    switch (data.type) {
      case "CARD":
        if (!data.paymentDetails?.cardNumber) {
          ctx.addIssue({
            code: "custom",
            path: ["paymentDetails", "cardNumber"],
            message: "Card number is required for card payments",
          });
        }
        break;

      case "UPI":
        if (!data.paymentDetails?.upiId) {
          ctx.addIssue({
            code: "custom",
            path: ["paymentDetails", "upiId"],
            message: "UPI ID is required for UPI payments",
          });
        }
        break;

      case "NET_BANKING":
        if (!data.paymentDetails?.transactionId) {
          ctx.addIssue({
            code: "custom",
            path: ["paymentDetails", "transactionId"],
            message: "Transaction ID is required for net banking payments",
          });
        }
        break;

      case "CASH":
      case "ADVANCE":
        break;
    }
  });

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;