import API_BASE_URL from "../config";

type LeaderboardItem = {
  user_id: number;
  value: number;
};

type Member = {
  id: number;
  name: string;
  profile_img_url: string;
};

type LeaderBoxProps = {
  title: string;
  data: LeaderboardItem[];
  unit: string;
  members: Member[];
};

const medalEmoji = ["🥇", "🥈", "🥉"];

export default function LeaderBox({ title, data, unit, members }: LeaderBoxProps) {
  return (
    <div className="glass rounded-2xl p-4 h-full flex flex-col justify-between">
      <h3 className="text-white font-bold text-sm mb-4 text-center">{title}</h3>
      <ul className="space-y-3">
        {data.length === 0 ? (
          <li className="text-white/50 text-center text-sm py-2">Nessun dato disponibile</li>
        ) : (
          data.map((item, idx) => {
            const user = members.find((m) => m.id === item.user_id);
            const medal = medalEmoji[idx] || `#${idx + 1}`;
            return (
              <li key={item.user_id} className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{medal}</span>
                  {user ? (
                    <>
                      <img
                        src={
                          user.profile_img_url.startsWith("/uploads/")
                            ? `${API_BASE_URL}${user.profile_img_url}`
                            : user.profile_img_url
                        }
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-white/30"
                      />
                      <span className="text-white/90 font-medium text-sm">{user.name}</span>
                    </>
                  ) : (
                    <span className="text-white/50 text-sm italic">Sconosciuto</span>
                  )}
                </div>
                <span className="text-white font-semibold text-sm">
                  {title.startsWith("Distanza") || title.startsWith("Veloc")
                    ? item.value.toFixed(2)
                    : item.value.toFixed(0)}{" "}
                  {unit}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
