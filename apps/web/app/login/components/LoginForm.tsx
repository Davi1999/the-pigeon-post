import { signIn } from "@/app/api/auth/auth";
import { TypographyH3 } from "@/components/typographyH3";
import { Button } from "@/components/ui/button";
import { TypographyH1 } from "@/components/ui/typographyH1";
import Image from "next/image";

export default function LoginForm() {
  const signInWithGitHub = async () => {
    "use server";
    await signIn("github");
  };

  return (
    <div className="grid grid-cols-1 gap-2 text-center">
      <h1 className="jacquard-24-charted-regular scroll-m-20 text-center text-9xl pb-12">
        The Pigeon Post
      </h1>
      <TypographyH1>
        Welcome,
      </TypographyH1>
      <TypographyH3>
        please sign in with your preferred authentication method.
      </TypographyH3>
      <br />
      <div className="flex justify-center">
        <Button
          className="px-4 py-2 text-lg flex items-center gap-2 mt-8"
          onClick={signInWithGitHub}
        >
          <Image
            src="/github-mark-white.svg"
            alt="github"
            width={24}
            height={24}
          />
          Sign in with GitHub
        </Button>
      </div>
    </div>
  );
}
