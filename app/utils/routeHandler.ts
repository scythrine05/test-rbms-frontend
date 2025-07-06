
type User = {
  role: string;
  email: string;
};

export const useUserRedirect = (user: User | undefined) => {

  const handleRedirect = () => {
    if (!user) return;

    if (user.role === "BRANCH_OFFICER" && user.email === "b@mail.com") {
      window.location.href = "/manage/request-table";
    }
    else if (user.role === "ADMIN") {
      window.location.href = "/admin/request-table";
    } else {
      window.location.href = "/dashboard";
    }
  };

  return handleRedirect;
};