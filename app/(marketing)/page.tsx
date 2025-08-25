"use client";
import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";

/**
 * DEMO: Avantages / Inconvénients des Promises pour le chargement d'images
 * Modes:
 *  - "no_promise": rend tout de suite, laisse chaque <img> gérer son propre onload/onerror
 *  - "all": précharge en parallèle avec Promise.all (fast mais casse tout si une seule erreur)
 *  - "allSettled": précharge en parallèle et filtre les échecs (UX robuste)
 *  - "sequential": charge une par une en await (plus lent, mais contrôle fin/ordre)
 */

type ImageItem = {
  id: number;
  url: string;
  title: string;
  description: string;
};

type Strategy = "no_promise" | "all" | "allSettled" | "sequential";

const sampleTitles = [
  "Sunset Over the Hills",
  "City Lights at Night",
  "Majestic Mountain Range",
  "Serene Lake View",
  "Blooming Spring Flowers",
  "Autumn Forest Path",
  "Starry Night Sky",
  "Golden Beach Morning",
  "Bustling Urban Street",
  "Peaceful Countryside",
  "Historic Castle Walls",
  "Colorful Hot Air Balloons",
  "Snowy Winter Landscape",
  "Calm Ocean Waves",
  "Vibrant Street Market",
  "Ancient Stone Bridge",
  "Foggy Riverside",
  "Lush Green Valley",
  "Desert Dunes",
  "Rainy Window Pane",
];

const sampleDescriptions = [
  "A breathtaking view as the sun sets behind rolling hills.",
  "The city comes alive with sparkling lights after dark.",
  "Towering peaks create a dramatic and awe-inspiring scene.",
  "A tranquil lake reflecting the beauty of nature.",
  "Bright and cheerful flowers mark the arrival of spring.",
  "A winding path through a forest ablaze with autumn colors.",
  "Stars twinkle in the clear night sky above.",
  "The beach glows with golden light in the early morning.",
  "People and cars fill the busy city street.",
  "Fields and farms stretch across the peaceful countryside.",
  "Ancient stones tell stories of a bygone era.",
  "Balloons of every color float gracefully in the sky.",
  "Snow blankets the landscape in a quiet hush.",
  "Gentle waves lap against the shore.",
  "Stalls overflow with goods and vibrant colors.",
  "A bridge stands strong over the flowing river.",
  "Mist rises from the water on a foggy morning.",
  "Green hills roll beneath a clear blue sky.",
  "Sand dunes ripple under the desert sun.",
  "Raindrops trace patterns on the glass.",
];

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function generateRandomImages(count: number, failureRate = 0): ImageItem[] {
  const images: ImageItem[] = [];
  for (let i = 0; i < count; i++) {
    const title = sampleTitles[getRandomInt(sampleTitles.length)];
    const description = sampleDescriptions[getRandomInt(sampleDescriptions.length)];
    // Simule des liens cassés selon failureRate
    const broken = Math.random() < failureRate;
    const url = broken
      ? `https://picsum.photos/400/300?random=${getRandomInt(1000)}&broken=1&noexist=1`
      : `https://picsum.photos/400/300?random=${getRandomInt(1000)}`;
    images.push({ id: i, url, title, description });
  }
  return images;
}

function loadOne(img: ImageItem): Promise<{ ok: boolean; item: ImageItem }> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.src = img.url;
    image.onload = () => resolve({ ok: true, item: img });
    image.onerror = () => resolve({ ok: false, item: img });
  });
}

function ImageWithLoader({ src, alt }: { src: string; alt: string }) {
  const [imgLoading, setImgLoading] = useState(true);
  return (
    <div className="relative w-full h-full">
      {imgLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-gray-200">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-900" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`object-cover w-full h-full ${imgLoading ? "hidden" : "block"}`}
        onLoad={() => setImgLoading(false)}
        onError={() => setImgLoading(false)}
      />
    </div>
  );
}

export default function Page() {
  const [strategy, setStrategy] = useState<Strategy>("no_promise");
  const [count, setCount] = useState(10);
  const [failureRate, setFailureRate] = useState(0); // 20% échecs simulés
  const [items, setItems] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageReadyCount, setImageReadyCount] = useState(0);

  // métriques
  const [metrics, setMetrics] = useState({
    total: 0,
    success: 0,
    failed: 0,
    ms: 0,
    note: "",
  });

  // (ré)génère la liste brute selon les sliders
  const rawImages = useMemo(() => generateRandomImages(count, failureRate), [count, failureRate]);

  async function runLoad() {
    setLoading(true);
    setImageReadyCount(0);
    const t0 = performance.now();

    if (strategy === "no_promise") {
      // Avantage: Simplicité + rendu immédiat
      // Inconvénient: pas de contrôle global (on ne sait pas quand tout est prêt / erreurs silencieuses)
      setItems(rawImages);
      setMetrics({
        total: rawImages.length,
        success: rawImages.length, // on suppose, car on ne wait pas
        failed: 0,
        ms: 0,
        note: "Rendu immédiat, contrôle minimal sur erreurs/état global.",
      });
      setLoading(false);
      return;
    }

    if (strategy === "all") {
      // Avantage: Parallélisme + fast path, simple à agréger
      // Inconvénient: une seule erreur => tout reject (UX fragile)
      try {
        let ready = 0;
        const promises = rawImages.map((img) =>
          loadOne(img).then((res) => {
            ready++;
            setImageReadyCount(ready);
            if (!res.ok) throw new Error("one image failed");
            return res.item;
          })
        );
        const loaded = await Promise.all(promises); // échoue si une image échoue
        const t1 = performance.now();
        setItems(loaded);
        setMetrics({
          total: rawImages.length,
          success: loaded.length,
          failed: rawImages.length - loaded.length,
          ms: Math.round(t1 - t0),
          note: "Promise.all: rapide mais casse si 1 échec (pas top UX).",
        });
      } catch {
        const t1 = performance.now();
        setItems([]);
        setMetrics({
          total: rawImages.length,
          success: 0,
          failed: rawImages.length,
          ms: Math.round(t1 - t0),
          note: "Promise.all a tout rejeté suite à une erreur (UX fragile).",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (strategy === "allSettled") {
      // Avantage: Parallélisme + robustesse (on garde les succès)
      // Inconvénient: il faut filtrer et gérer les erreurs soi-même
      let ready = 0;
      const promises = rawImages.map((img) =>
        loadOne(img).then((res) => {
          ready++;
          setImageReadyCount(ready);
          if (!res.ok) throw new Error("image failed");
          return res.item;
        })
      );
      const settled = await Promise.allSettled(promises);
      const okItems = settled
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<ImageItem>).value);

      const t1 = performance.now();
      setItems(okItems);
      setMetrics({
        total: rawImages.length,
        success: okItems.length,
        failed: rawImages.length - okItems.length,
        ms: Math.round(t1 - t0),
        note: "Promise.allSettled: robuste, garde les succès (UX mziane).",
      });
      setLoading(false);
      return;
    }

    if (strategy === "sequential") {
      // Avantage: Contrôle, ordre garanti, feedback progressif
      // Inconvénient: plus lent (pas de parallélisme)
      const ok: ImageItem[] = [];
      let failed = 0;
      for (let i = 0; i < rawImages.length; i++) {
        const res = await loadOne(rawImages[i]);
        setImageReadyCount(i + 1);
        if (res.ok) ok.push(res.item);
        else failed++;
      }
      const t1 = performance.now();
      setItems(ok);
      setMetrics({
        total: rawImages.length,
        success: ok.length,
        failed,
        ms: Math.round(t1 - t0),
        note: "Séquentiel: contrôle maximal mais plus lent (pas de parallélisme).",
      });
      setLoading(false);
      return;
    }
  }

  useEffect(() => {
    runLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy, count, failureRate]);

  return (
    <div className="min-h-screen w-full bg-white p-6">
      <h1 className="text-2xl font-bold mb-2">Promises & UX de chargement d’images</h1>
      <p className="text-sm text-gray-600 mb-6">
        Compare les stratégies et observe succès/échecs, temps total et comportement d’interface.
      </p>

      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-4 items-end mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Stratégie</label>
          <select
            className="border rounded px-3 py-2"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as Strategy)}
          >
            <option value="no_promise">Sans promesse (rendu direct)</option>
            <option value="all">Promise.all (rapide, fragile)</option>
            <option value="allSettled">Promise.allSettled (robuste)</option>
            <option value="sequential">Séquentiel (await boucle)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre d’images: {count}</label>
          <input
            type="range"
            min={4}
            max={24}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
          />
        </div>

       

        <button
          onClick={runLoad}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 border shadow-sm hover:bg-gray-50 active:scale-[.99] transition"
        >
          <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Relancer le test
        </button>
      </div>

      {/* Explanation blurb */}
      <div className="mb-6 text-sm">
        {strategy === "no_promise" && (
          <ul className="list-disc pl-6">
            <li><span className="font-semibold">Avantages :</span> Simplicité, rendu immédiat.</li>
            <li><span className="font-semibold">Inconvénients :</span> Peu de contrôle global, erreurs silencieuses.</li>
          </ul>
        )}
        {strategy === "all" && (
          <ul className="list-disc pl-6">
            <li><span className="font-semibold">Avantages :</span> Parallèle et rapide quand tout va bien.</li>
            <li><span className="font-semibold">Inconvénients :</span> Un seul échec ⇒ tout échoue (UX fragile).</li>
          </ul>
        )}
        {strategy === "allSettled" && (
          <ul className="list-disc pl-6">
            <li><span className="font-semibold">Avantages :</span> Robuste, on conserve les succès (UX mziane).</li>
            <li><span className="font-semibold">Inconvénients :</span> Un peu plus de code pour filtrer et compter.</li>
          </ul>
        )}
        {strategy === "sequential" && (
          <ul className="list-disc pl-6">
            <li><span className="font-semibold">Avantages :</span> Contrôle fin, ordre garanti, feedback progressif.</li>
            <li><span className="font-semibold">Inconvénients :</span> Plus lent (pas de parallélisme), complexité temporelle accrue.</li>
          </ul>
        )}
      </div>

      {/* Metrics */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-semibold">{metrics.total}</div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-gray-500">Succès</div>
          <div className="text-lg font-semibold text-green-700">{metrics.success}</div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-gray-500">Échecs</div>
          <div className="text-lg font-semibold text-red-700">{metrics.failed}</div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-gray-500">Préchargées</div>
          <div className="text-lg font-semibold">{imageReadyCount}</div>
        </div>
        <div className="p-3 rounded-lg border col-span-2 md:col-span-1">
          <div className="text-xs text-gray-500">Temps total</div>
          <div className="text-lg font-semibold">{metrics.ms} ms</div>
        </div>
      </div>
      {metrics.note && <p className="text-sm text-gray-700 mb-6 italic">{metrics.note}</p>}

      {/* Gallery */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-72 w-full">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-900" />
          <p className="mt-2 text-sm">Chargement de {imageReadyCount} / {rawImages.length} images…</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 justify-start">
          {items.map((item) => (
            <div key={item.id} className="relative w-80 h-56">
              <ImageWithLoader src={item.url} alt={item.title} />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white">
                <h2 className="text-sm font-bold">{item.title}</h2>
                <p className="text-xs">{item.description}</p>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-red-700">
              Aucune image affichable (essaie <span className="font-semibold">allSettled</span> ou baisse le taux d’échec).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
