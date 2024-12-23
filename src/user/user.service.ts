import { Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "argon2";
import { User } from "prisma/__generate__";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UserService {
	public constructor(private readonly prisma: PrismaService) {}

	public async findById(id: string): Promise<User> {
		const user = await this.prisma.user.findUnique({
			where: {
				id: id,
			},
			include: {
				account: true,
			},
		});

		if (!user) {
			throw new NotFoundException("User not found");
		}

		return user;
	}

	public async findByEmail(email: string): Promise<User> {
		return await this.prisma.user.findUnique({
			where: {
				email: email,
			},
			include: {
				account: true,
			},
		});
	}

	public async create(
		name: string,
		email: string,
		password: string
	): Promise<User> {
		const user = await this.prisma.user.create({
			data: {
				name,
				email,
				password: password ? await hash(password) : "",
			},
			include: {
				account: true,
			},
		});

		return user;
	}
}
