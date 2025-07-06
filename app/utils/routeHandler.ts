
type User = {
  role: string;
  email: string;
};

// Changed from useUserRedirect hook to a regular function
export const handleUserRedirect = (user: User | undefined) => {
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