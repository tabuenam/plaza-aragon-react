import Image from "next/image";

export function SpaceGallery({ images, name }: { images: string[]; name: string }) {
  if (!images || images.length === 0) {
    return (
      <div className="relative flex aspect-16/10 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-azul/5 via-turquesa/10 to-maiz/10">
        <div className="text-center p-6">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm text-azul font-display text-lg font-bold">
            PA
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-piedra">
            Plaza Aragón · {name}
          </span>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-crema">
        <Image
          src={images[0]}
          alt={`Fotografía de ${name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="no-scrollbar flex w-full snap-x snap-mandatory gap-3 overflow-x-auto rounded-2xl pb-2">
        {images.map((src, index) => (
          <div
            key={index}
            className="relative aspect-16/10 w-[85%] shrink-0 snap-center overflow-hidden rounded-2xl bg-crema sm:w-[90%]"
          >
            <Image
              src={src}
              alt={`Fotografía ${index + 1} de ${name}`}
              fill
              sizes="(max-width: 768px) 85vw, 400px"
              className="object-cover"
            />
            <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
              {index + 1} / {images.length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
