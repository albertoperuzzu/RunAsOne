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
    <div className="bg-white rounded-2xl shadow-lg p-4 h-full flex flex-col justify-between">
      <h3 className="text-base font-bold mb-4 text-center">{title}</h3>
      <ul className="space-y-3">
        {data.length === 0 ? (
          <li className="text-gray-400 text-center py-2">Nessun dato disponibile</li>
        ) : (
          data.map((item, idx) => {
            const user = members.find((m) => m.id === item.user_id);
            const medal = medalEmoji[idx] || `#${idx + 1}`;
            return (
              <li key={item.user_id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{medal}</span>
                  {user ? (
                    <>
                      <img
                        src={ user.profile_img_url.startsWith("/uploads/") ? `http://localhost:8000${user.profile_img_url}` : user.profile_img_url }
                        alt={ user.name }
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="font-medium text-sm">{ user.name }</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 italic">Utente sconosciuto</span>
                  )}
                </div>
                <span className="text-sm font-semibold">{title.startsWith("Distanza") || title.startsWith("Veloc") ? item.value.toFixed(2) : item.value.toFixed(0)} {unit}</span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}