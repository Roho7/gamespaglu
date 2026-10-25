import { Redis } from "@upstash/redis";

export type RoomRedis = {
  ping(): Promise<string>;
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { nx?: boolean; px?: number }): Promise<boolean>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  zAdd(key: string, score: number, member: string): Promise<void>;
  zRem(key: string, member: string): Promise<void>;
  zRangeByScore(key: string, max: number): Promise<string[]>;
  compareAndDel(key: string, token: string): Promise<boolean>;
};

const RELEASE = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;


export function connectRoomRedis(url: string, token: string): RoomRedis {
  return adapt(new Redis({ url, token }));
}

function adapt(client: Redis): RoomRedis {
  return {
    ping: () => client.ping(),
    get: (key) => client.get(key),
    async set(key, value, opts) {
      const px = opts?.px;
      const wrote =
        opts?.nx && px !== undefined
          ? await client.set(key, value, { nx: true, px })
          : opts?.nx
            ? await client.set(key, value, { nx: true })
            : px !== undefined
              ? await client.set(key, value, { px })
              : await client.set(key, value);
      return wrote === "OK";
    },
    async del(key) {
      await client.del(key);
    },
    async exists(key) {
      return (await client.exists(key)) === 1;
    },
    async zAdd(key, score, member) {
      await client.zadd(key, { score, member });
    },
    async zRem(key, member) {
      await client.zrem(key, member);
    },
    async zRangeByScore(key, max) {
      const members = await client.zrange(key, "-inf", max, { byScore: true });
      return members.map(String);
    },
    async compareAndDel(key, token) {
      const removed = await client.eval(RELEASE, [key], [token]);
      return Number(removed) === 1;
    },
  };
}
