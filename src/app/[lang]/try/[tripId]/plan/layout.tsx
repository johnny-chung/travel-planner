type Props = {
  children: React.ReactNode;
  modal: React.ReactNode;
};

export default function TrialPlanLayout({ children, modal }: Props) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
