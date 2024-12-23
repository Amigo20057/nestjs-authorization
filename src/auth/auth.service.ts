import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { verify } from "argon2";
import { Request, Response } from "express";
import { User } from "prisma/__generate__";
import { UserService } from "src/user/user.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
	public constructor(
		private readonly userService: UserService,
		private readonly configService: ConfigService
	) {}

	public async register(req: Request, dto: RegisterDto) {
		const userExists = await this.userService.findByEmail(dto.email);

		if (userExists) {
			throw new ConflictException("User exists");
		}

		const newUser = await this.userService.create(
			dto.name,
			dto.email,
			dto.password
		);

		return this.saveSession(req, newUser);
	}

	public async login(req: Request, dto: LoginDto) {
		const user = await this.userService.findByEmail(dto.email);

		if (!user || !user.password) {
			throw new NotFoundException("User not found");
		}

		const isValidatePassword = await verify(user.password, dto.password);

		if (!isValidatePassword) {
			throw new UnauthorizedException("Wrong data");
		}

		return this.saveSession(req, user);
	}

	public async logout(req: Request, res: Response): Promise<void> {
		return new Promise((resolve, reject) => {
			req.session.destroy(err => {
				if (err) {
					return reject(
						new InternalServerErrorException("Error logout session")
					);
				}
				res.clearCookie(this.configService.getOrThrow<string>("SESSION_NAME"));
				resolve();
			});
		});
	}

	private async saveSession(req: Request, user: User) {
		return new Promise((resolve, reject) => {
			req.session.userId = user.id;

			req.session.save(err => {
				if (err) {
					return reject(new InternalServerErrorException("Error save session"));
				}
				resolve({ user });
			});
		});
	}
}
