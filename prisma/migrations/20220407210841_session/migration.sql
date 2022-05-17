-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file" BYTEA NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
