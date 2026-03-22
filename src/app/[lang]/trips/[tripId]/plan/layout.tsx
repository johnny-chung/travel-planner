type Props = {
  children: React.ReactNode;
  modal: React.ReactNode;
};

export default function TripPlanLayout({ children, modal }: Props) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
