export const calculateTax = (fees: number, taxRate: number) => {
    const tax = (fees * taxRate)/100;
    return tax;
}