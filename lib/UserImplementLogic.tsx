
interface UserDataType {
    id: string;
    email: string;
    username: string;
    role: number;
    _created_at: number;
    _updated_at: number;
    discord: {
        avatar: string;
        banner: string;
        id: string;
        global_name: string;
    };
    getAvatar: () => string;
    getBanner: () => string;
    getUsername: () => string;
    quests: {
        total: number;
        getLevel: () => {
            level: number;
            percentage: number;
            maximum: number;
            actual: number;
            remaining: number;
        };
        completed: number;  
        level: number;
        items: any[];
    };
}

export function User(user: UserDataType)
{

    const { id, avatar, banner } = user.discord;

    user.getAvatar = () => {

        const DEFAULT_AVATAR = parseInt(((BigInt(id) >> 22n) % 6n).toString());

        if (user.discord.avatar)
            return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
        return `https://cdn.discordapp.com/embed/avatars/${DEFAULT_AVATAR}.png`; 
    };

    user.getBanner = () => {

        if (!banner) return user.getAvatar();

        const isGif = banner.includes("a_");
        if (isGif)
            return `https://cdn.discordapp.com/banners/${id}/${banner}.gif`;
        return `https://cdn.discordapp.com/banners/${id}/${banner}.png`

    };

    console.log(user);
    user.getUsername = () => user.discord.global_name ? user.discord.global_name : user.username;

    user.quests.getLevel = () => {
        const XP_TOTAL = user.quests.total;
        let level = 0;
        let maxXpLevel = 600;
        let minXpLevel = 0;

        while (XP_TOTAL > maxXpLevel) {
            level++;
            minXpLevel = maxXpLevel;
            maxXpLevel += maxXpLevel * 1.25;
        }


        const percentage = (XP_TOTAL - minXpLevel) / (maxXpLevel - minXpLevel) * 100;

        return {
            level: level + 1,
            percentage: parseFloat(percentage.toFixed(2)),
            maximum: maxXpLevel,
            minimum: minXpLevel,
            actual: XP_TOTAL,
            remaining: maxXpLevel - XP_TOTAL
        };
    };

    return user;
}

export type { UserDataType };