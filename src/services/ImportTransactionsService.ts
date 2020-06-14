import fs from 'fs';
import csvParse from 'csv-parse';
import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class ImportTransactionsService {
  async execute(path: string): Promise<Transaction[]> {
    const transactions: Request[] = [];

    const stream = fs.createReadStream(path);
    const parses = csvParse({
      from_line: 2,
    });

    const csv = stream.pipe(parses);

    csv.on('data', async line => {
      const [title, type, value, category] = line.map((column: string) =>
        column.trim(),
      );
      if (!title || !type || !value) return;
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => csv.on('end', resolve));

    const createTransactionService = new CreateTransactionService();

    // eslint-disable-next-line no-restricted-syntax
    for (const transaction of transactions) {
      // eslint-disable-next-line no-await-in-loop
      await createTransactionService.execute({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: transaction.category,
      });
    }

    const transactionRepository = getCustomRepository(TransactionsRepository);
    const transactionsCreated = transactionRepository.find();
    return transactionsCreated;
  }
}

export default ImportTransactionsService;
