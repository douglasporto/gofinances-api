import { getCustomRepository, getRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!['income', 'outcome'].includes(type))
      throw new Error('Types not expected');

    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && value > total)
      throw new AppError(`You don't have money enough ${total} - ${value}`);

    let transCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!transCategory) {
      transCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(transCategory);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: transCategory,
    });
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
